import Venta from "../models/venta.model.js";
import ProductoTienda from "../models/productoTienda.model.js";
import Compra from "../models/compra.model.js";
import DeudaVenta from "../models/deudaVenta.model.js"; // Importar el modelo de deudas de venta
import { registrarTransaccionFinanciera } from './finanzas.controller.js';

export const registrarVenta = async (req, res) => {
  try {
    // 0. GENERAR NÚMERO DE VENTA CORRELATIVO
    const lastVenta = await Venta.findOne().sort({ numVenta: -1 });
    const nuevoNumVenta = (lastVenta && lastVenta.numVenta) ? lastVenta.numVenta + 1 : 1;

    const ventaData = { ...req.body, numVenta: nuevoNumVenta };

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
    ventaData.saldoPendiente = montoCredito; // Actualizar saldo pendiente en la venta
    ventaData.estado = montoCredito > 0 ? "Pendiente" : "Pagada"; // Estado depende del crédito
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

export const getEstadisticasVentas = async (req, res) => {
  try {
    const { year, period, month, date } = req.query;
    let matchCondition = {};
    const now = new Date();

    if (period === 'day' && date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      matchCondition.fecha = { $gte: startOfDay, $lte: endOfDay };
    } else if (period === 'month' && year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      matchCondition.fecha = { $gte: startDate, $lte: endDate };
    } else if (year) {
      const currentYear = parseInt(year);
      matchCondition.fecha = {
        $gte: new Date(currentYear, 0, 1),
        $lte: new Date(currentYear, 11, 31, 23, 59, 59)
      };
    } else {
      const currentYear = now.getFullYear();
      matchCondition.fecha = {
        $gte: new Date(currentYear, 0, 1),
        $lte: new Date(currentYear, 11, 31, 23, 59, 59)
      };
    }

    let groupId;
    if (period === 'day') {
      groupId = { hour: { $hour: "$fecha" } };
    } else if (period === 'month') {
      groupId = { day: { $dayOfMonth: "$fecha" } };
    } else {
      groupId = { month: { $month: "$fecha" } };
    }

    const ventasAgrupadas = await Venta.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: groupId,
          count: { $sum: 1 },
          totalVentaValue: {
            $sum: {
              $reduce: {
                input: "$productos",
                initialValue: 0,
                in: { $add: ["$$value", { $multiply: ["$$this.cantidad", "$$this.precioUnitario"] }] }
              }
            }
          },
          totalPendiente: { $sum: "$saldoPendiente" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const resumenQuery = await Venta.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          totalIngresos: {
            $sum: {
              $reduce: {
                input: "$productos",
                initialValue: 0,
                in: { $add: ["$$value", { $multiply: ["$$this.cantidad", "$$this.precioUnitario"] }] }
              }
            }
          },
          totalProductosVendidos: {
            $sum: {
              $reduce: {
                input: "$productos",
                initialValue: 0,
                in: { $add: ["$$value", "$$this.cantidad"] }
              }
            }
          },
          totalPendiente: { $sum: "$saldoPendiente" },
          totalVentas: { $sum: 1 }
        }
      }
    ]);

    // Aggregation for Top Selling Products
    const productosMasVendidos = await Venta.aggregate([
      { $match: matchCondition },
      { $unwind: "$productos" },
      {
        $group: {
          _id: "$productos.producto",
          totalCantidad: { $sum: "$productos.cantidad" },
          totalVenta: { $sum: { $multiply: ["$productos.cantidad", "$productos.precioUnitario"] } }
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
          _id: 1,
          nombre: "$productoInfo.nombre",
          cantidad: "$totalCantidad",
          total: "$totalVenta"
        }
      },
      { $sort: { cantidad: -1 } },
      { $limit: 5 }
    ]);

    // Aggregation for Sales by Category
    const ventasPorCategoria = await Venta.aggregate([
      { $match: matchCondition },
      { $unwind: "$productos" },
      {
        $lookup: {
          from: "productotiendas",
          localField: "productos.producto",
          foreignField: "_id",
          as: "productoInfo"
        }
      },
      { $unwind: "$productoInfo" },
      {
        $group: {
          _id: "$productoInfo.categoria",
          totalVentas: { $sum: { $multiply: ["$productos.cantidad", "$productos.precioUnitario"] } },
          cantidad: { $sum: "$productos.cantidad" }
        }
      },
      { $sort: { totalVentas: -1 } }
    ]);

    const resumen = resumenQuery[0] || { totalIngresos: 0, totalPendiente: 0, totalVentas: 0, totalProductosVendidos: 0 };
    const totalCobradoResumen = resumen.totalIngresos - resumen.totalPendiente;

    const ventasGrafica = ventasAgrupadas.map(item => {
      const totalVenta = item.totalVentaValue || 0;
      const pendiente = item.totalPendiente || 0;
      return {
        period: item._id,
        totalCobrado: totalVenta - pendiente,
        totalPendiente: pendiente,
        totalVenta: totalVenta
      };
    });

    res.status(200).json({
      resumenTotal: {
        totalIngresos: resumen.totalIngresos,
        totalCobrado: totalCobradoResumen,
        totalPendiente: resumen.totalPendiente,
        totalVentas: resumen.totalVentas,
        totalProductosVendidos: resumen.totalProductosVendidos
      },
      ventasGrafica: ventasGrafica,
      productosMasVendidos,
      ventasPorCategoria
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de ventas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};


export const eliminarVenta = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DELETE /api/ventas/:id] id: ${id}`);
    const venta = await Venta.findById(id);

    if (!venta) {
      return res.status(404).json({ msg: "Venta no encontrada" });
    }

    // Devolver el stock de los productos
    const updatePromises = venta.productos.map(item =>
      ProductoTienda.findByIdAndUpdate(item.producto, {
        $inc: { cantidad: item.cantidad, ventasAcumuladas: -item.cantidad }
      })
    );
    await Promise.all(updatePromises);

    // Eliminar deudas asociadas
    await DeudaVenta.deleteMany({ ventaId: id });

    // Eliminar la venta
    await Venta.findByIdAndDelete(id);

    res.json({ msg: "Venta eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la venta:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

// Reporte avanzado de ventas
export const generarReporteVentas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, clienteId } = req.body;

    let query = {};

    if (fechaInicio && fechaFin) {
      const start = new Date(fechaInicio);
      start.setHours(0, 0, 0, 0);
      const end = new Date(fechaFin);
      end.setHours(23, 59, 59, 999);
      query.fecha = { $gte: start, $lte: end };
    }

    if (clienteId) {
      query.cliente = clienteId;
    }

    const ventas = await Venta.find(query)
      .populate('cliente', 'nombre empresa')
      .populate('productos.producto', 'nombre codigo')
      .sort({ fecha: -1 });

    // Calcular totales
    const totalVentas = ventas.length;
    const totalIngresos = ventas.reduce((sum, venta) => {
      const totalVenta = venta.productos.reduce((s, p) => s + (p.cantidad * p.precioUnitario), 0);
      return sum + totalVenta;
    }, 0);

    // Calcular saldo pendiente total
    const totalSaldoPendiente = ventas.reduce((sum, venta) => sum + (venta.saldoPendiente || 0), 0);

    res.json({
      resumen: {
        totalVentas,
        totalIngresos,
        totalSaldoPendiente
      },
      detalles: ventas
    });

  } catch (error) {
    console.error("Error al generar reporte de ventas:", error);
    res.status(500).json({ message: "Error al generar reporte", error: error.message });
  }
};
