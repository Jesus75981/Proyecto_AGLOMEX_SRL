import Compra from "../models/compra.model.js";
import ProductoTienda from "../models/productoTienda.model.js"; // Asegúrate de que esta línea exista
import { registrarTransaccionFinanciera } from './finanzas.controller.js';

/**
 * Función que encuentra un producto por ID o Nombre. Si no existe, lo crea automáticamente
 * con los datos mínimos requeridos (nombre, dimensiones, imagen).
 * @param {Object} itemData - Datos del producto proporcionados en el array de la compra.
 * @returns {Promise<string>} El ID de MongoDB (_id) del producto encontrado o creado.
 */
const encontrarOCrearProducto = async (itemData) => {
    const {
        productoId,
        nombreProducto,
        colorProducto,
        categoriaProducto,
        dimensiones,
        imagenProducto
    } = itemData;

    let producto = null;

    // 1. Intentar buscar por ID (ObjectId) si se proporciona (para productos existentes)
    if (productoId) {
        producto = await ProductoTienda.findById(productoId);
    }

    // 2. Si no se encontró por ID, intentar buscar por Nombre
    if (!producto && nombreProducto) {
        // Asumiendo que el nombre es suficiente para buscar si ya existe
        producto = await ProductoTienda.findOne({ nombre: nombreProducto });
    }

    // 3. Si AÚN no se encuentra, crearlo automáticamente con los datos mínimos.
    if (!producto) {
        // Validamos que los datos mínimos estén presentes
        if (!nombreProducto || !colorProducto || !categoriaProducto) {
             throw new Error("Datos insuficientes para crear un nuevo producto. Se requiere nombre, color y categoría.");
        }

        // Generar código automático usando la función del productoTienda.controller.js
        const generarCodigoInterno = (nombre) => {
            const prefix = nombre ? nombre.substring(0, 3).toUpperCase() : 'PRO';
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            return `${prefix}-${randomSuffix}`;
        };

        const idProductoTienda = generarCodigoInterno(nombreProducto);

        // Creamos la nueva REFERENCIA en ProductoTienda.
        const nuevoProducto = new ProductoTienda({
            nombre: nombreProducto,
            idProductoTienda: idProductoTienda,
            color: colorProducto,
            categoria: categoriaProducto,
            dimensiones: dimensiones || {},
            imagen: imagenProducto || "",
        });

        producto = await nuevoProducto.save();
        console.log(`[INVENTARIO]: Nueva referencia de producto creada: ${producto.nombre} (${producto._id})`);
    }

    return producto._id; // Retornamos el ID de MongoDB (_id) del producto
};

export const registrarCompra = async (req, res) => {
    const datosCompra = req.body;

    try {
        if (!datosCompra.productos || datosCompra.productos.length === 0) {
            return res.status(400).json({ message: "La compra debe contener al menos un producto." });
        }

        // --- VALIDACIÓN DE PAGOS MÚLTIPLES (CRÍTICO) ---
        // Calcula la suma de todos los montos de pago del array metodosPago
        const totalPagos = datosCompra.metodosPago
            ? datosCompra.metodosPago.reduce((sum, pago) => sum + pago.monto, 0)
            : 0;

        // Compara la suma de pagos con el total de la compra (usando tolerancia para flotantes)
        if (Math.abs(totalPagos - datosCompra.totalCompra) > 0.01) {
            return res.status(400).json({
                message: `Error de pago. El total de la compra (${datosCompra.totalCompra.toFixed(2)}) no coincide con la suma de los pagos (${totalPagos.toFixed(2)}).`
            });
        }
        // -------------------------------------------------


        // --- 1. PRE-PROCESAMIENTO: IDENTIFICAR O CREAR PRODUCTOS NUEVOS ---
        const preProcessPromises = datosCompra.productos.map(async (item) => {
            const productoObjectId = await encontrarOCrearProducto({
                productoId: item.producto,
                nombreProducto: item.nombreProducto,
                colorProducto: item.colorProducto,
                categoriaProducto: item.categoriaProducto,
                dimensiones: item.dimensiones,
                imagenProducto: item.imagenProducto
            });
            // Reemplazamos el campo 'producto' (que podría ser el nombre) con el ObjectId real
            return { ...item, producto: productoObjectId };
        });

        datosCompra.productos = await Promise.all(preProcessPromises);

        // --- 2. REGISTRAR LA COMPRA (incluye metodosPago) ---
        const nuevaCompra = new Compra(datosCompra);
        const compraGuardada = await nuevaCompra.save();

        // --- 3. ACTUALIZAR EL INVENTARIO (productos_tienda) - AUMENTAR STOCK Y PRECIO COMPRA ---

        const updatePromises = datosCompra.productos.map(item => {
            const cantidadAumentada = item.cantidad;
            const precioCompra = item.precioUnitario;

            const updateFields = {
                $inc: {
                    cantidad: cantidadAumentada
                },
                $set: {
                    precioCompra: precioCompra,
                }
            };

            return ProductoTienda.findByIdAndUpdate(
                item.producto,
                updateFields,
                { new: true }
            ).orFail(new Error(`ProductoTienda con ID ${item.producto} no encontrado para actualizar stock.`));
        });

        const inventarioActualizado = await Promise.all(updatePromises);

        // --- 4. REGISTRAR TRANSACCIÓN FINANCIERA: Egreso por compra de productos ---
        await registrarTransaccionFinanciera(
            'egreso',
            datosCompra.tipoCompra === 'Materia Prima' ? 'compra_materias' : 'compra_productos',
            `Compra #${compraGuardada.numCompra} - ${datosCompra.tipoCompra}`,
            datosCompra.totalCompra,
            compraGuardada._id,
            'Compra',
            {
                numCompra: compraGuardada.numCompra,
                tipoCompra: datosCompra.tipoCompra,
                metodosPago: datosCompra.metodosPago
            },
            'BOB', // Moneda: Bolivianos
            1 // Tipo de cambio: 1 para BOB
        );

        // 5. VERIFICAR ALERTAS DE STOCK BAJO DESPUÉS DE LA COMPRA: Verificar si algún producto salió del estado "Stock Bajo"
        const alertasStockNormalizado = [];
        for (const item of datosCompra.productos) {
            const productoActualizado = await ProductoTienda.findById(item.producto);
            if (productoActualizado && productoActualizado.cantidad > 5) { // Si ahora tiene más de 5 unidades
                // Verificar si antes estaba en stock bajo (esto es aproximado, ya que no tenemos el estado anterior)
                // Podríamos agregar un campo para trackear cambios de estado
                alertasStockNormalizado.push({
                    producto: productoActualizado.nombre,
                    stockActual: productoActualizado.cantidad,
                    mensaje: "Stock normalizado después de compra"
                });
            }
        }

        // 6. Respuesta exitosa con alertas si las hay
        const respuesta = {
            message: `Compra #${compraGuardada.numCompra} registrada y stock actualizado.`,
            compra: compraGuardada,
            inventarioAfectado: inventarioActualizado
        };

        if (alertasStockNormalizado.length > 0) {
            respuesta.alertas = alertasStockNormalizado;
            respuesta.mensajeAdicional = "Algunos productos han salido del estado de stock bajo.";
        }

        res.status(201).json(respuesta);

    } catch (error) {
        console.error("Error al registrar la compra y actualizar stock:", error.message);

        // Manejo de errores específicos para validación de datos (pago, producto, esquema)
        const statusCode = error.name === 'ValidationError' || error.message.includes('insuficientes') || error.message.includes('crear') || error.message.includes('pago') ? 400 : 500;
        res.status(statusCode).json({ message: "Error al registrar la compra.", error: error.message });
    }
};

/**
 * Lista las Compras registradas.
 */
export const listarCompras = async (req, res) => {
    try {
        const historial = await Compra.find()
                                        .populate('productos.producto') // Traer información del producto
                                        .populate('proveedor')         // Traer información del proveedor
                                        .limit(50)
                                        .sort({ fecha: -1 });
        res.status(200).json(historial);
    } catch (error) {
        res.status(500).json({ message: "Error al listar compras", error: error.message });
    }
};
