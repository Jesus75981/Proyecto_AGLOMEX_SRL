import Compra from "../models/compra.model.js";
import ProductoTienda from "../models/productoTienda.model.js";
import MateriaPrima from "../models/materiaPrima.model.js";
import DeudaCompra from "../models/deudaCompra.model.js"; // Importar el modelo de deudas
import { registrarTransaccionFinanciera } from './finanzas.controller.js';
import Objeto3D from "../models/objetos3d.model.js";
import * as tripoService from "../services/tripo.service.js";

/**
 * Función que encuentra un producto por ID o Nombre. Si no existe, lo crea automáticamente
 * con los datos mínimos requeridos (nombre, dimensiones, imagen).
 * @param {Object} itemData - Datos del producto proporcionados en el array de la compra.
 * @param {string} tipoCompra - Tipo de compra: "Materia Prima" o "Producto Terminado"
 * @returns {Promise<string>} El ID de MongoDB (_id) del producto encontrado o creado.
 */
const encontrarOCrearProducto = async (itemData, tipoCompra) => {
    const {
        productoId,
        nombreProducto,
        colorProducto,
        categoriaProducto,
        dimensiones,
        imagenProducto
    } = itemData;

    let producto = null;

    // Determinar el modelo según el tipo de compra
    const Modelo = tipoCompra === "Materia Prima" ? MateriaPrima : ProductoTienda;

    // 1. Intentar buscar por ID (ObjectId) si se proporciona (para productos existentes)
    if (productoId) {
        producto = await Modelo.findById(productoId);
    }

    // 2. Si no se encontró por ID, intentar buscar por Nombre
    if (!producto && nombreProducto) {
        producto = await Modelo.findOne({ nombre: nombreProducto });
    }

    // 3. Si AÚN no se encuentra, crearlo automáticamente con los datos mínimos.
    if (!producto) {
        // Validamos que los datos mínimos estén presentes
        if (!nombreProducto) {
            throw new Error("Datos insuficientes para crear un nuevo producto. Se requiere nombre.");
        }

        if (tipoCompra === "Producto Terminado" && (!colorProducto || !categoriaProducto)) {
            throw new Error("Datos insuficientes para crear un nuevo producto terminado. Se requiere nombre, color y categoría.");
        }

        if (tipoCompra === "Materia Prima") {
            // Para materia prima, generar código interno
            const generarCodigoInterno = (nombre) => {
                const prefix = nombre ? nombre.substring(0, 3).toUpperCase() : 'MAT';
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                return `${prefix}-${randomSuffix}`;
            };

            const idMateriaPrima = generarCodigoInterno(nombreProducto);

            // Creamos la nueva materia prima
            const nuevaMateriaPrima = new MateriaPrima({
                nombre: nombreProducto,
                idMateriaPrima: idMateriaPrima,
                descripcion: itemData.descripcion || "",
                precioCompra: itemData.precioUnitario,
                precioVenta: itemData.precioVenta || 0,
                categoria: itemData.categoria || "Otro",
                ubicacion: itemData.ubicacion || "",
                tamano: itemData.tamano || "",
                codigo: itemData.codigo || "",
            });

            producto = await nuevaMateriaPrima.save();
            console.log(`[INVENTARIO]: Nueva materia prima creada: ${producto.nombre} (${producto._id})`);
        } else {
            // Para producto terminado, generar código interno
            const generarCodigoInterno = (nombre) => {
                const prefix = nombre ? nombre.substring(0, 3).toUpperCase() : 'PRO';
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                return `${prefix}-${randomSuffix}`;
            };

            const idProductoTienda = generarCodigoInterno(nombreProducto);

            // Creamos el nuevo producto terminado
            const nuevoProducto = new ProductoTienda({
                nombre: nombreProducto,
                idProductoTienda: idProductoTienda,
                color: colorProducto,
                categoria: categoriaProducto,
                dimensiones: dimensiones || {},
                imagen: imagenProducto || "",
                precioCompra: itemData.precioUnitario,
                codigo: itemData.codigo || idProductoTienda, // Use provided codigo or fallback to idProductoTienda
            });

            producto = await nuevoProducto.save();
            console.log(`[INVENTARIO]: Nuevo producto terminado creado: ${producto.nombre} (${producto._id})`);

            // [NUEVO] Iniciar generación de modelo 3D si hay imagen (Lógica copiada de productoTienda.controller.js)
            if (producto.imagen && producto.imagen.startsWith('http')) {
                (async () => {
                    try {
                        console.log(`[TRIPO] Iniciando generación 3D para producto ${producto.nombre} (desde Compras)...`);
                        const taskId = await tripoService.create3DTask(producto.imagen);

                        const nuevoObjeto3D = new Objeto3D({
                            producto: producto._id,
                            sourceImage: producto.imagen,
                            tripoTaskId: taskId,
                            status: 'queued'
                        });
                        await nuevoObjeto3D.save();

                        // Vincular al producto
                        producto.objeto3D = nuevoObjeto3D._id;
                        await producto.save();
                        console.log(`[TRIPO] Tarea creada desde Compras: ${taskId}`);
                    } catch (error) {
                        console.error("[TRIPO] Error al iniciar generación desde Compras:", error.message);
                    }
                })();
            }
        }
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
                imagenProducto: item.imagenProducto,
                descripcion: item.descripcion,
                categoria: item.categoria,
                ubicacion: item.ubicacion,
                tamano: item.tamano,
                codigo: item.codigo,
                precioUnitario: item.precioUnitario,
                precioVenta: item.precioVenta
            }, datosCompra.tipoCompra);
            return {
                ...item,
                producto: productoObjectId,
                onModel: datosCompra.tipoCompra === "Materia Prima" ? "MateriaPrima" : "ProductoTienda"
            };
        });
        datosCompra.productos = await Promise.all(preProcessPromises);

        // --- 2. REGISTRAR LA COMPRA ---
        const nuevaCompra = new Compra(datosCompra);
        const compraGuardada = await nuevaCompra.save();

        // --- 3. ACTUALIZAR EL INVENTARIO ---
        const updatePromises = datosCompra.productos.map(item => {
            const Modelo = datosCompra.tipoCompra === "Materia Prima" ? MateriaPrima : ProductoTienda;
            return Modelo.findByIdAndUpdate(
                item.producto,
                {
                    $inc: { cantidad: item.cantidad },
                    $set: { precioCompra: item.precioUnitario }
                },
                { new: true }
            ).orFail(new Error(`${datosCompra.tipoCompra} con ID ${item.producto} no encontrado.`));
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
            const Modelo = datosCompra.tipoCompra === "Materia Prima" ? MateriaPrima : ProductoTienda;
            const productoActualizado = await Modelo.findById(item.producto);
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

/**
 * Actualiza una compra existente.
 */
export const actualizarCompra = async (req, res) => {
    try {
        const { id } = req.params;
        const datosActualizados = req.body;

        // Buscar la compra existente
        const compraExistente = await Compra.findById(id);
        if (!compraExistente) {
            return res.status(404).json({ message: "Compra no encontrada." });
        }

        // Validaciones básicas
        if (datosActualizados.tipoCompra && !["Materia Prima", "Producto Terminado"].includes(datosActualizados.tipoCompra)) {
            return res.status(400).json({ message: "El tipo de compra debe ser 'Materia Prima' o 'Producto Terminado'." });
        }

        if (datosActualizados.proveedor) {
            const Proveedor = (await import("../models/proveedores.model.js")).default;
            const proveedorExistente = await Proveedor.findById(datosActualizados.proveedor);
            if (!proveedorExistente) {
                return res.status(400).json({ message: "El proveedor especificado no existe." });
            }
        }

        if (datosActualizados.productos && Array.isArray(datosActualizados.productos)) {
            for (const item of datosActualizados.productos) {
                if (item.cantidad <= 0 || typeof item.cantidad !== 'number') {
                    return res.status(400).json({ message: "La cantidad de cada producto debe ser un número positivo." });
                }
                if (item.precioUnitario <= 0 || typeof item.precioUnitario !== 'number') {
                    return res.status(400).json({ message: "El precio unitario de cada producto debe ser un número positivo." });
                }
            }
        }

        // Calcular nuevo total si se actualizan productos
        if (datosActualizados.productos && Array.isArray(datosActualizados.productos)) {
            const nuevoTotal = datosActualizados.productos.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
            datosActualizados.totalCompra = nuevoTotal;
        }

        // Actualizar la compra
        const compraActualizada = await Compra.findByIdAndUpdate(
            id,
            datosActualizados,
            { new: true, runValidators: true }
        ).populate('productos.producto').populate('proveedor');

        res.status(200).json({
            message: "Compra actualizada exitosamente.",
            compra: compraActualizada
        });

    } catch (error) {
        console.error("Error al actualizar la compra:", error.message);
        const statusCode = error.name === 'ValidationError' ? 400 : 500;
        res.status(statusCode).json({ message: "Error al actualizar la compra.", error: error.message });
    }
};

/**
 * Obtiene una compra específica por ID.
 */
export const obtenerCompraPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const compra = await Compra.findById(id)
            .populate('productos.producto')
            .populate('proveedor');

        if (!compra) {
            return res.status(404).json({ message: "Compra no encontrada." });
        }

        res.status(200).json(compra);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener la compra.", error: error.message });
    }
};
