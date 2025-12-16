import Compra from "../models/compra.model.js";
import ProductoTienda from "../models/productoTienda.model.js";
import MateriaPrima from "../models/materiaPrima.model.js";
import DeudaCompra from "../models/deudaCompra.model.js";
import BankAccount from "../models/bankAccount.model.js";
import BankTransaction from "../models/bankTransaction.model.js";
import { registrarTransaccionFinanciera } from './finanzas.controller.js';
import Objeto3D from "../models/objetos3d.model.js";
import * as tripoService from "../services/tripo.service.js";

/**
 * Función que encuentra un producto por ID o Nombre. Si no existe, lo crea automáticamente.
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
    const Modelo = tipoCompra === "Materia Prima" ? MateriaPrima : ProductoTienda;

    if (productoId) {
        producto = await Modelo.findById(productoId);
    }

    if (!producto && nombreProducto) {
        // Búsqueda insensible a mayúsculas/minúsculas para nombre Y coincidencia exacta de color (o insensible si se prefiere)
        // Para ser más flexibles, haremos ambos insensibles
        let filter = { nombre: { $regex: new RegExp(`^${nombreProducto}$`, 'i') } };

        if (tipoCompra === "Producto Terminado" && colorProducto) {
            filter.color = { $regex: new RegExp(`^${colorProducto}$`, 'i') };
        }

        producto = await Modelo.findOne(filter);
    }

    if (!producto) {
        // Validamos que los datos mínimos estén presentes
        if (!nombreProducto) {
            throw new Error("Datos insuficientes para crear un nuevo producto. Se requiere nombre.");
        }

        if (tipoCompra === "Producto Terminado" && (!colorProducto || !categoriaProducto)) {
            throw new Error("Datos insuficientes para crear un nuevo producto terminado. Se requiere nombre, color y categoría.");
        }

        if (tipoCompra === "Materia Prima") {
            const generarCodigoInterno = (nombre) => {
                const prefix = nombre ? nombre.substring(0, 3).toUpperCase() : 'MAT';
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                return `${prefix}-${randomSuffix}`;
            };

            const idMateriaPrima = generarCodigoInterno(nombreProducto);

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
            const generarCodigoInterno = (nombre) => {
                const prefix = nombre ? nombre.substring(0, 3).toUpperCase() : 'PRO';
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                return `${prefix}-${randomSuffix}`;
            };

            const idProductoTienda = generarCodigoInterno(nombreProducto);

            const nuevoProducto = new ProductoTienda({
                nombre: nombreProducto,
                idProductoTienda: idProductoTienda,
                color: colorProducto,
                categoria: categoriaProducto,
                dimensiones: dimensiones || {},
                imagen: imagenProducto || "",
                precioCompra: itemData.precioUnitario,
                codigo: itemData.codigo || idProductoTienda,
            });

            producto = await nuevoProducto.save();
            console.log(`[INVENTARIO]: Nuevo producto terminado creado: ${producto.nombre} (${producto._id})`);

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

    return producto._id;
};

export const registrarCompra = async (req, res) => {
    const datosCompra = req.body;

    try {
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

        // Validaciones de productos
        for (const item of datosCompra.productos) {
            if (!item.producto && (!item.nombreProducto || !item.colorProducto || !item.categoriaProducto)) {
                return res.status(400).json({ message: "Cada producto debe tener un ID o nombre, color y categoría para crearlo." });
            }
            if (item.cantidad <= 0 || typeof item.cantidad !== 'number') {
                return res.status(400).json({ message: "La cantidad de cada producto debe ser un número positivo." });
            }
        }

        // Pagos
        const pagosReales = [];
        if (datosCompra.metodosPago && Array.isArray(datosCompra.metodosPago)) {
            for (const pago of datosCompra.metodosPago) {
                if (pago.tipo === 'Transferencia') {
                    if (!pago.cuentaId) {
                        return res.status(400).json({ message: "Para transferencias, debe seleccionar una cuenta bancaria." });
                    }
                    const bankAccount = await BankAccount.findById(pago.cuentaId);
                    if (!bankAccount) {
                        return res.status(400).json({ message: "La cuenta bancaria seleccionada no existe." });
                    }
                    if (bankAccount.saldo < pago.monto) {
                        return res.status(400).json({ message: `Fondos insuficientes en la cuenta ${bankAccount.nombreBanco}.` });
                    }
                    pago._bankAccount = bankAccount;
                }
                pagosReales.push(pago);
            }
        }

        const totalPagadoDirectamente = pagosReales.reduce((sum, pago) => {
            return pago.tipo === 'Crédito' ? sum : sum + pago.monto;
        }, 0);

        let saldoPendiente = datosCompra.totalCompra - totalPagadoDirectamente;
        saldoPendiente = Math.round(saldoPendiente * 100) / 100;

        datosCompra.saldoPendiente = saldoPendiente;
        datosCompra.metodosPago = pagosReales;
        datosCompra.estado = saldoPendiente > 0 ? "Pendiente" : "Pagada";
        if (saldoPendiente <= 0) datosCompra.saldoPendiente = 0;

        // Pre-procesamiento de productos
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

        const nuevaCompra = new Compra(datosCompra);
        const compraGuardada = await nuevaCompra.save();

        // Actualizar inventario
        const updatePromises = datosCompra.productos.map(item => {
            const Modelo = datosCompra.tipoCompra === "Materia Prima" ? MateriaPrima : ProductoTienda;
            return Modelo.findByIdAndUpdate(
                item.producto,
                {
                    $inc: { cantidad: item.cantidad },
                    $set: { precioCompra: item.precioUnitario } // Automatic update of purchase price
                },
                { new: true }
            ).orFail(new Error(`${datosCompra.tipoCompra} con ID ${item.producto} no encontrado.`));
        });
        await Promise.all(updatePromises);

        // Registrar Deuda
        if (datosCompra.saldoPendiente > 0) {
            const nuevaDeuda = new DeudaCompra({
                compraId: compraGuardada._id,
                proveedor: compraGuardada.proveedor,
                montoOriginal: datosCompra.saldoPendiente,
                montoPagado: 0,
                saldoActual: datosCompra.saldoPendiente,
                estado: 'Pendiente'
            });
            await nuevaDeuda.save();
        }

        // Finanzas
        if (totalPagadoDirectamente > 0) {
            for (const pago of pagosReales) {
                if (pago.tipo === 'Transferencia' && pago._bankAccount) {
                    const bankAccount = pago._bankAccount;
                    bankAccount.saldo -= pago.monto;
                    await bankAccount.save();

                    const bankTx = new BankTransaction({
                        cuentaId: bankAccount._id,
                        tipo: 'Compra',
                        monto: pago.monto,
                        descripcion: `Compra #${compraGuardada.numCompra}`,
                        referenciaId: compraGuardada._id,
                        fecha: new Date()
                    });
                    await bankTx.save();
                }
            }
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
                    metodosPago: pagosReales.map(p => ({
                        tipo: p.tipo,
                        monto: p.monto,
                        cuenta: p._bankAccount ? p._bankAccount.nombreBanco : null
                    }))
                },
                'BOB',
                1
            );
        }

        res.status(201).json({
            message: `Compra #${compraGuardada.numCompra} registrada. Stock actualizado.`,
            compra: compraGuardada
        });

    } catch (error) {
        console.error("Error al registrar la compra:", error);

        // Duplicate Key Error Handling
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            if (field === 'numCompra') {
                return res.status(400).json({ message: "Error: El número de compra ya existe. Por favor intente de nuevo." });
            }
            if (field === 'nombre') {
                return res.status(400).json({ message: `Error: Ya existe un producto con el nombre '${error.keyValue[field]}'.` });
            }
            return res.status(400).json({ message: `Error de duplicado en el campo ${field}.` });
        }

        // Mongoose Validation Error
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: "Error de validación: " + messages.join(', ') });
        }

        // Log critical error to file
        import('fs').then(fs => {
            fs.appendFileSync('crash_compras.txt', `[${new Date().toISOString()}] ${error.stack}\n`);
        });

        console.error("CRASH COMPRA:", error);
        res.status(500).json({ message: "Error al registrar la compra.", error: error.message, stack: error.stack });
    }
};

export const listarCompras = async (req, res) => {
    try {
        const historial = await Compra.find()
            .populate('productos.producto')
            .populate('proveedor')
            .limit(50)
            .sort({ fecha: -1 });
        res.status(200).json(historial);
    } catch (error) {
        res.status(500).json({ message: "Error al listar compras", error: error.message });
    }
};

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

        const compraExistente = await Compra.findById(id);
        if (!compraExistente) {
            return res.status(404).json({ message: "Compra no encontrada." });
        }

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

// Reporte avanzado de compras

export const generarReporteCompras = async (req, res) => {
    try {
        const { fechaInicio, fechaFin, proveedorId } = req.body;
        let query = {};

        if (fechaInicio && fechaFin) {
            const start = new Date(fechaInicio);
            start.setHours(0, 0, 0, 0);
            const end = new Date(fechaFin);
            end.setHours(23, 59, 59, 999);
            query.fecha = { $gte: start, $lte: end };
        }

        if (proveedorId) {
            query.proveedor = proveedorId;
        }

        if (req.body.productoId) {
            query['productos.producto'] = req.body.productoId;
        }

        if (req.body.searchQuery) {
            query.numCompra = { $regex: req.body.searchQuery, $options: 'i' };
        }

        const compras = await Compra.find(query)
            .populate('proveedor', 'nombre nit')
            .populate('productos.producto', 'nombre codigo color idProductoTienda')
            .sort({ fecha: -1 });

        const totalCompras = compras.length;
        const totalGastos = compras.reduce((sum, compra) => sum + compra.totalCompra, 0);
        const totalSaldoPendiente = compras.reduce((sum, compra) => sum + (compra.saldoPendiente || 0), 0);

        res.json({
            resumen: { totalCompras, totalGastos, totalSaldoPendiente },
            detalles: compras
        });

    } catch (error) {
        console.error("Error al generar reporte de compras:", error);
        res.status(500).json({ message: "Error al generar reporte", error: error.message });
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

/**
 * Obtener estadísticas de compras para el dashboard
 */
export const obtenerEstadisticas = async (req, res) => {
    try {
        const { year, period, month, date } = req.query;
        let matchStage = {};

        // Filtros de fecha simplificados para brevedad
        if (year) {
            const currentYear = parseInt(year);
            matchStage.fecha = { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) };
        } else {
            const currentYear = new Date().getFullYear();
            matchStage.fecha = { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) };
        }

        const comprasAgrupadas = await Compra.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { month: { $month: "$fecha" } },
                    totalGasto: { $sum: "$totalCompra" },
                    totalPendiente: { $sum: "$saldoPendiente" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const comprasGrafica = comprasAgrupadas.map(item => ({
            period: item._id,
            totalGasto: item.totalGasto,
            totalPendiente: item.totalPendiente
        }));

        res.json({
            comprasMensuales: comprasGrafica,
            estadisticasGenerales: { totalGasto: 0 }, // Placeholder
            comprasRecientes: [],
            comprasPorTipo: [],
            comprasPorEstado: []
        });

    } catch (error) {
        console.error("Error al obtener estadísticas de compras:", error);
        res.status(500).json({ message: "Error al obtener estadísticas de compras" });
    }
};

export const obtenerSiguienteNumeroCompra = async (req, res) => {
    try {
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
            nextNum = parseInt(lastNumStr, 10) + 1;
        }
        const siguienteNumero = `${prefix}${nextNum.toString().padStart(4, '0')}`;

        res.status(200).json({ siguienteNumero });
    } catch (error) {
        console.error("Error al obtener siguiente número de compra:", error);
        res.status(500).json({ message: "Error al generar el número de compra", error: error.message });
    }
};
