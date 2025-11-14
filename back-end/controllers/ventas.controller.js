import Venta from "../models/venta.model.js";
import ProductoTienda from "../models/productoTienda.model.js";
import Compra from "../models/compra.model.js";
import DeudaVenta from "../models/deudaVenta.model.js"; // Importar el modelo de deudas de venta
import { registrarTransaccionFinanciera } from './finanzas.controller.js';

export const registrarVenta = async (req, res) => {
    try {
        const ventaData = req.body;

        // 1. VALIDACIÓN DE STOCK
        const productosVendidos = ventaData.productos;
        const productosInsuficientes = [];
        for (const item of productosVendidos) {
            const producto = await ProductoTienda.findById(item.producto);
            if (!producto) return res.status(404).json({ msg: `Producto con ID ${item.producto} no encontrado.` });
            if (producto.cantidad < item.cantidad) {
                productosInsuficientes.push({ nombre: producto.nombre, stockActual: producto.cantidad, solicitado: item.cantidad });
            }
        }
        if (productosInsuficientes.length > 0) {
            return res.status(400).json({ msg: "Stock insuficiente", productosInsuficientes });
        }

        // 2. VALIDACIÓN Y CÁLCULO DE PAGOS Y CRÉDITO
        const pagosReales = [];
        let montoCredito = 0;
        const totalVenta = ventaData.productos.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);

        if (!ventaData.metodosPago || !Array.isArray(ventaData.metodosPago) || ventaData.metodosPago.length === 0) {
            montoCredito = totalVenta; // Asumir toda la venta a crédito si no hay métodos de pago
        } else {
            for (const pago of ventaData.metodosPago) {
                if (!pago.tipo || !["Efectivo", "Transferencia", "Cheque", "Crédito"].includes(pago.tipo)) {
                    return res.status(400).json({ message: "Tipo de pago no válido." });
                }
                if (pago.monto <= 0 || typeof pago.monto !== 'number') {
                    return res.status(400).json({ message: "Monto de pago no válido." });
                }
                if (pago.tipo === "Crédito") {
                    montoCredito += pago.monto;
                } else {
                    pagosReales.push(pago);
                }
            }
        }

        const totalPagadoDirectamente = pagosReales.reduce((sum, pago) => sum + pago.monto, 0);
        if (Math.abs(totalVenta - (totalPagadoDirectamente + montoCredito)) > 0.01) {
            return res.status(400).json({ message: "La suma de pagos y crédito no coincide con el total de la venta." });
        }

        // Configurar datos de la venta
        ventaData.saldoPendiente = 0; // El saldo se gestiona en DeudaVenta
        ventaData.estado = "Pagada"; // La venta se considera 'Pagada'
        ventaData.metodosPago = pagosReales; // Guardar solo pagos reales

        // 3. CREAR VENTA Y ACTUALIZAR INVENTARIO
        const nuevaVenta = new Venta(ventaData);
        const ventaGuardada = await nuevaVenta.save();
        await ventaGuardada.populate("cliente productos.producto");

        const updatePromises = productosVendidos.map(item =>
            ProductoTienda.findByIdAndUpdate(item.producto, {
                $inc: { cantidad: -item.cantidad, ventasAcumuladas: item.cantidad }
            }, { new: true })
        );
        await Promise.all(updatePromises);

        // 4. GESTIONAR DEUDA SI HAY CRÉDITO
        if (montoCredito > 0) {
            const nuevaDeuda = new DeudaVenta({
                ventaId: ventaGuardada._id,
                cliente: ventaGuardada.cliente,
                montoOriginal: montoCredito,
                saldoActual: montoCredito,
                estado: 'Pendiente'
            });
            await nuevaDeuda.save();
            console.log(`[DEUDA VENTA]: Deuda registrada por venta ${ventaGuardada.numVenta}. Saldo: ${montoCredito}`);
        }

        // 5. REGISTRAR TRANSACCIÓN FINANCIERA (SOLO INGRESO REAL)
        if (totalPagadoDirectamente > 0) {
            await registrarTransaccionFinanciera(
                'ingreso',
                'venta_productos',
                `Ingreso por Venta #${ventaGuardada.numVenta}`,
                totalPagadoDirectamente,
                ventaGuardada._id,
                'Venta',
                { metodosPago: pagosReales, numVenta: ventaGuardada.numVenta },
                'BOB', 1
            );
        }

        // 6. VERIFICAR ALERTAS DE STOCK BAJO
        const alertasStockBajo = [];
        for (const item of productosVendidos) {
            const productoActualizado = await ProductoTienda.findById(item.producto);
            if (productoActualizado && productoActualizado.cantidad <= 5) {
                alertasStockBajo.push({
                    producto: productoActualizado.nombre,
                    stockActual: productoActualizado.cantidad,
                    mensaje: "Stock bajo"
                });
            }
        }

        // 7. RESPUESTA
        const respuesta = {
            msg: "Venta registrada exitosamente.",
            venta: ventaGuardada,
            ...(alertasStockBajo.length > 0 && { alertas: alertasStockBajo })
        };
        return res.status(201).json(respuesta);

    } catch (error) {
        console.error("Error al registrar la venta:", error);
        return res.status(500).json({ msg: "Error interno del servidor.", error: error.message });
    }
};

// Nueva función para obtener compras por día
export const getComprasByDay = async (req, res) => {
  try {
    // Obtener la fecha del cuerpo de la solicitud (asegúrate de que el formato es 'YYYY-MM-DD')
    const { date } = req.body;

    // Convertir la fecha de entrada en un objeto de fecha para la consulta
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Buscar compras en la base de datos para ese día y poblar productos y proveedor
    const comprasDelDia = await Compra.find({
      fecha: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    }).populate('productos.producto proveedor');

    // Calcular el total para cada compra y agregar el campo
    const comprasConTotal = comprasDelDia.map(compra => {
      const total = compra.productos.reduce((sum, item) => {
        return sum + (item.precioUnitario * item.cantidad);
      }, 0);

      return {
        ...compra.toObject(),
        total: total
      };
    });

    // Enviar los datos encontrados como una respuesta
    res.status(200).json({
      success: true,
      data: comprasConTotal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las compras del día',
      error: error.message
    });
  }
};

export const listarVentas = async (req, res) => {
  try {
    const ventas = await Venta.find()
      .populate("cliente productos.producto")
      .sort({ fecha: -1 }); // Ordenar por fecha descendente (más recientes primero)

    // Agregar campo 'estado' basado en la lógica de negocio
    const ventasConEstado = ventas.map(venta => ({
      ...venta.toObject(),
      estado: 'Completada' // Todas las ventas registradas se consideran completadas
    }));

    res.json(ventasConEstado);
  } catch (error) {
    console.error("Error al listar ventas:", error);
    res.status(500).json({
      msg: "Error interno del servidor al obtener las ventas.",
      error: error.message
    });
  }
};

// Nueva función para obtener ventas por día
export const getVentasByDay = async (req, res) => {
  try {
    // Obtener la fecha del cuerpo de la solicitud (asegúrate de que el formato es 'YYYY-MM-DD')
    const { date } = req.body;

    // Convertir la fecha de entrada en un objeto de fecha para la consulta
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Buscar ventas en la base de datos para ese día y poblar cliente y productos
    const ventasDelDia = await Venta.find({
      fecha: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    }).populate('cliente productos.producto');

    // Calcular el total para cada venta y agregar el campo
    const ventasConTotal = ventasDelDia.map(venta => {
      const total = venta.productos.reduce((sum, item) => {
        return sum + (item.precioUnitario * item.cantidad);
      }, 0);

      return {
        ...venta.toObject(),
        total: total
      };
    });

    // Enviar los datos encontrados como una respuesta
    res.status(200).json({
      success: true,
      data: ventasConTotal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las ventas del día',
      error: error.message
    });
  }
};

// Nueva función para obtener estadísticas de ventas mensuales y anuales
export const getEstadisticasVentas = async (req, res) => {
  try {
    const { year, month } = req.query;

    let matchCondition = {};

    if (year) {
      matchCondition.fecha = {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${parseInt(year) + 1}-01-01`)
      };
    }

    if (month && year) {
      const startDate = new Date(`${year}-${month.padStart(2, '0')}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
      matchCondition.fecha = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // Agregación para obtener estadísticas mensuales
    const ventasMensuales = await Venta.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            year: { $year: "$fecha" },
            month: { $month: "$fecha" }
          },
          totalVentas: { $sum: 1 },
          totalIngresos: {
            $sum: {
              $reduce: {
                input: "$productos",
                initialValue: 0,
                in: { $add: ["$$value", { $multiply: ["$$this.cantidad", "$$this.precioUnitario"] }] }
              }
            }
          },
          productosVendidos: {
            $sum: {
              $reduce: {
                input: "$productos",
                initialValue: 0,
                in: { $add: ["$$value", "$$this.cantidad"] }
              }
            }
          }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Agregación para obtener estadísticas anuales
    const ventasAnuales = await Venta.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { year: { $year: "$fecha" } },
          totalVentas: { $sum: 1 },
          totalIngresos: {
            $sum: {
              $reduce: {
                input: "$productos",
                initialValue: 0,
                in: { $add: ["$$value", { $multiply: ["$$this.cantidad", "$$this.precioUnitario"] }] }
              }
            }
          },
          productosVendidos: {
            $sum: {
              $reduce: {
                input: "$productos",
                initialValue: 0,
                in: { $add: ["$$value", "$$this.cantidad"] }
              }
            }
          }
        }
      },
      {
        $sort: { "_id.year": 1 }
      }
    ]);

    // Estadísticas por producto más vendido
    const productosMasVendidos = await Venta.aggregate([
      { $match: matchCondition },
      { $unwind: "$productos" },
      {
        $group: {
          _id: "$productos.producto",
          totalVendido: { $sum: "$productos.cantidad" },
          totalIngresos: { $sum: { $multiply: ["$productos.cantidad", "$productos.precioUnitario"] } }
        }
      },
      {
        $lookup: {
          from: "productotiendas",
          localField: "_id",
          foreignField: "_id",
          as: "productoInfo"
        }
      },
      { $unwind: "$productoInfo" },
      {
        $project: {
          nombre: "$productoInfo.nombre",
          totalVendido: 1,
          totalIngresos: 1
        }
      },
      { $sort: { totalVendido: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ventasMensuales,
        ventasAnuales,
        productosMasVendidos
      }
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de ventas:", error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de ventas',
      error: error.message
    });
  }
};
