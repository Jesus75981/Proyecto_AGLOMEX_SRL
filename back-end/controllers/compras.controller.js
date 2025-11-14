import Compra from "../models/compra.model.js";
import ProductoTienda from "../models/productoTienda.model.js";
import DeudaCompra from "../models/deudaCompra.model.js"; // Importar el modelo de deudas
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
        // --- GENERAR NÚMERO DE COMPRA CORRELATIVO ---
        const today = new Date();
        const dateStr = today.getFullYear().toString() +
                        (today.getMonth() + 1).toString().padStart(2, '0') +
                        today.getDate().toString().padStart(2, '0');
        const prefix = `COMP-${dateStr}-`;

        const ultimaCompraDelDia = await Compra.findOne({
            numCompra: { $regex: `^${prefix}` }
        }).sort({ numCompra: -1 });

        let nextNum = 1;
        if (ultimaCompraDelDia && ultimaCompraDelDia.numCompra) {
            const lastNumStr = ultimaCompraDelDia.numCompra.split('-')[2];
            const lastNum = parseInt(lastNumStr, 10);
            nextNum = lastNum + 1;
        }
        datosCompra.numCompra = `${prefix}${nextNum.toString().padStart(4, '0')}`;

        // --- VALIDACIONES INICIALES ---
        if (!datosCompra.tipoCompra || !["Materia Prima", "Producto Terminado"].includes(datosCompra.tipoCompra)) {
            return res.status(400).json({ message: "El tipo de compra es obligatorio y debe ser 'Materia Prima' o 'Producto Terminado'." });
        }
        if (!datosCompra.proveedor) {
            return res.status(400).json({ message: "El proveedor es obligatorio." });
        }
        const Proveedor = (await import("../models/proveedores.model.js")).default;
        const proveedorExistente = await Proveedor.findById(datosCompra.proveedor);
        if (!proveedorExistente) {
            return res.status(400).json({ message: "El proveedor especificado no existe." });
        }
        if (!datosCompra.productos || !Array.isArray(datosCompra.productos) || datosCompra.productos.length === 0) {
            return res.status(400).json({ message: "La compra debe contener al menos un producto." });
        }
        for (const item of datosCompra.productos) {
            if (!item.producto && (!item.nombreProducto || !item.colorProducto || !item.categoriaProducto)) {
                return res.status(400).json({ message: "Cada producto debe tener un ID o nombre, color y categoría para crearlo." });
            }
            if (item.cantidad <= 0 || typeof item.cantidad !== 'number') {
                return res.status(400).json({ message: "La cantidad de cada producto debe ser un número positivo." });
            }
            if (item.precioUnitario <= 0 || typeof item.precioUnitario !== 'number') {
                return res.status(400).json({ message: "El precio unitario de cada producto debe ser un número positivo." });
            }
        }
        const totalEsperado = datosCompra.productos.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
        if (Math.abs(totalEsperado - datosCompra.totalCompra) > 0.01) {
            return res.status(400).json({
                message: `El total de la compra (${datosCompra.totalCompra}) no coincide con la suma de los productos (${totalEsperado.toFixed(2)}).`
            });
        }

        // --- VALIDACIÓN Y CÁLCULO DE PAGOS (LÓGICA MODIFICADA PARA CRÉDITO) ---
        const pagosReales = [];
        let montoCredito = 0;

        if (!datosCompra.metodosPago || !Array.isArray(datosCompra.metodosPago) || datosCompra.metodosPago.length === 0) {
            // Si no hay métodos de pago, se asume que toda la compra es a crédito.
            montoCredito = datosCompra.totalCompra;
        } else {
            for (const pago of datosCompra.metodosPago) {
                if (!pago.tipo || !["Efectivo", "Transferencia", "Cheque", "Crédito"].includes(pago.tipo)) {
                    return res.status(400).json({ message: "Cada método de pago debe tener un tipo válido: Efectivo, Transferencia, Cheque o Crédito." });
                }
                if (pago.monto <= 0 || typeof pago.monto !== 'number') {
                    return res.status(400).json({ message: "El monto de cada pago debe ser un número positivo." });
                }

                if (pago.tipo === "Crédito") {
                    montoCredito += pago.monto;
                } else {
                    pagosReales.push(pago);
                }
            }
        }

        const totalPagadoDirectamente = pagosReales.reduce((sum, pago) => sum + pago.monto, 0);
        const totalComprometido = totalPagadoDirectamente + montoCredito;

        if (Math.abs(datosCompra.totalCompra - totalComprometido) > 0.01) {
            return res.status(400).json({
                message: `La suma de los pagos (${totalPagadoDirectamente.toFixed(2)}) y el crédito (${montoCredito.toFixed(2)}) no coincide con el total de la compra (${datosCompra.totalCompra.toFixed(2)}).`
            });
        }

        // La compra se considera 'Pagada' o 'Cerrada' porque el crédito está documentado en DeudaCompra.
        // El saldo pendiente en la COMPRA ahora es CERO.
        datosCompra.saldoPendiente = 0;
        datosCompra.estado = "Pagada";
        datosCompra.metodosPago = pagosReales; // Guardar solo los pagos reales en la compra.

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
            return { ...item, producto: productoObjectId };
        });
        datosCompra.productos = await Promise.all(preProcessPromises);

        // --- 2. REGISTRAR LA COMPRA ---
        const nuevaCompra = new Compra(datosCompra);
        const compraGuardada = await nuevaCompra.save();

        // --- 3. ACTUALIZAR EL INVENTARIO ---
        const updatePromises = datosCompra.productos.map(item => {
            return ProductoTienda.findByIdAndUpdate(
                item.producto,
                {
                    $inc: { cantidad: item.cantidad },
                    $set: { precioCompra: item.precioUnitario }
                },
                { new: true }
            ).orFail(new Error(`ProductoTienda con ID ${item.producto} no encontrado.`));
        });
        const inventarioActualizado = await Promise.all(updatePromises);

        // --- 4. GESTIONAR DEUDA SI HAY MONTO A CRÉDITO ---
        if (montoCredito > 0) {
            const nuevaDeuda = new DeudaCompra({
                compraId: compraGuardada._id,
                proveedor: compraGuardada.proveedor,
                montoOriginal: montoCredito,
                montoPagado: 0,
                saldoActual: montoCredito,
                estado: 'Pendiente'
            });
            await nuevaDeuda.save();
            console.log(`[DEUDA]: Se registró deuda por la compra ${compraGuardada.numCompra}. Saldo: ${montoCredito}`);
        }

        // --- 5. REGISTRAR TRANSACCIÓN FINANCIERA (SOLO EGRESO REAL) ---
        if (totalPagadoDirectamente > 0) {
            await registrarTransaccionFinanciera(
                'egreso',
                datosCompra.tipoCompra === 'Materia Prima' ? 'compra_materias' : 'compra_productos',
                `Pago de Compra #${compraGuardada.numCompra}`,
                totalPagadoDirectamente,
                compraGuardada._id,
                'Compra',
                {
                    numCompra: compraGuardada.numCompra,
                    tipoCompra: datosCompra.tipoCompra,
                    metodosPago: pagosReales
                },
                'BOB',
                1
            );
        }

        // --- 6. VERIFICAR ALERTAS DE STOCK ---
        const alertasStockNormalizado = [];
        for (const item of datosCompra.productos) {
            const productoActualizado = await ProductoTienda.findById(item.producto);
            if (productoActualizado && productoActualizado.cantidad > 5) {
                alertasStockNormalizado.push({
                    producto: productoActualizado.nombre,
                    stockActual: productoActualizado.cantidad,
                    mensaje: "Stock normalizado después de compra"
                });
            }
        }

        // --- 7. RESPUESTA EXITOSA ---
        const respuesta = {
            message: `Compra #${compraGuardada.numCompra} registrada. Stock actualizado.`,
            compra: compraGuardada,
            inventarioAfectado: inventarioActualizado
        };
        if (alertasStockNormalizado.length > 0) {
            respuesta.alertas = alertasStockNormalizado;
        }
        res.status(201).json(respuesta);

    } catch (error) {
        console.error("Error al registrar la compra:", error.message);
        const statusCode = error.name === 'ValidationError' || error.message.includes('insuficientes') || error.message.includes('no coincide') ? 400 : 500;
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

/**
 * Lista las Compras que tienen saldo pendiente.
 */
export const listarComprasConSaldo = async (req, res) => {
    try {
        const comprasConSaldo = await Compra.find({
            saldoPendiente: { $gt: 0 },
            estado: { $in: ["Pendiente", "Parcialmente Pagada"] }
        })
        .populate('proveedor')
        .sort({ fecha: -1 });
        res.status(200).json(comprasConSaldo);
    } catch (error) {
        res.status(500).json({ message: "Error al listar las compras con saldo.", error: error.message });
    }
};
