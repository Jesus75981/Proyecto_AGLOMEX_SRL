import mongoose from 'mongoose';
import Finanzas from '../models/finanzas.model.js';
import Logistica from '../models/logistica.model.js';
import Venta from '../models/venta.model.js';
import Compra from '../models/compra.model.js';

import DeudaCompra from '../models/deudaCompra.model.js';
import DeudaVenta from '../models/deudaVenta.model.js';
import Maquina from '../models/maquina.model.js';
import MateriaPrima from '../models/materiaPrima.model.js';
import ProductoTienda from '../models/productoTienda.model.js';
import Proveedor from '../models/proveedores.model.js';
import BankAccount from '../models/bankAccount.model.js';
import BankTransaction from '../models/bankTransaction.model.js';

// Función para registrar transacción financiera automáticamente
export const registrarTransaccionFinanciera = async (tipo, categoria, descripcion, monto, referenciaId = null, referenciaModel = null, metadata = {}, currency = 'BOB', exchangeRate = 1) => {
  try {
    // Calcular el monto en bolivianos
    const amountBOB = currency === 'USD' ? monto * exchangeRate : monto;

    const nuevaTransaccion = new Finanzas({
      type: tipo,
      category: categoria,
      description: descripcion,
      amount: monto,
      currency: currency,
      exchangeRate: exchangeRate,
      amountBOB: amountBOB,
      referenceId: referenciaId,
      referenceModel: referenciaModel,
      metadata: metadata
    });

    await nuevaTransaccion.save();
    console.log(`[FINANZAS] Transacción registrada: ${tipo} - ${categoria} - ${monto} ${currency} (${amountBOB} BOB)`);
    return nuevaTransaccion;
  } catch (error) {
    console.error('Error al registrar transacción financiera:', error);
    throw error;
  }
};

// Obtener todas las transacciones
export const getTransactions = async (req, res) => {
  try {
    const transactions = await Finanzas.find().sort({ date: -1 }); // Ordena de más reciente a más antiguo
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener transacciones.' });
  }
};

// Crear una nueva transacción
export const createTransaction = async (req, res) => {
  const { type, category, description, amount, currency, exchangeRate, date, cuentaId } = req.body;

  if (!type || !category || !description || !amount) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
  }

  try {
    const montoNum = parseFloat(amount);
    const amountBOB = currency === 'USD' ? montoNum * (exchangeRate || 1) : montoNum;
    let metadata = {};

    // --- Lógica de Cuenta Bancaria / Caja ---
    if (cuentaId) {
      const banco = await BankAccount.findById(cuentaId);
      if (!banco) {
        return res.status(404).json({ message: 'Cuenta seleccionada no encontrada.' });
      }

      // Actualizar saldo
      if (type === 'ingreso') {
        banco.saldo += amountBOB;
      } else {
        // egreso
        banco.saldo -= amountBOB;
      }
      await banco.save();

      // Registrar movimiento bancario
      const bankTx = new BankTransaction({
        cuentaId: banco._id,
        tipo: type === 'ingreso' ? 'Deposito' : 'Retiro',
        monto: amountBOB,
        fecha: date || Date.now(),
        descripcion: `[Manual] ${description}`,
        referenciaId: null // Se vinculará implícitamente por descripción/fecha
      });
      await bankTx.save();

      metadata = {
        cuentaId: banco._id,
        cuenta: `${banco.nombreBanco} - ${banco.tipo === 'efectivo' ? 'Caja' : banco.numeroCuenta}`,
        banco: banco.nombreBanco
      };
    }
    // ----------------------------------------

    const newTransaction = new Finanzas({
      type,
      category,
      description,
      amount,
      currency: currency || 'BOB',
      exchangeRate: exchangeRate || 1,
      amountBOB: amountBOB,
      date: date || Date.now(),
      metadata
    });
    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Transacción duplicada detectada." });
    }
    res.status(500).json({ message: 'Error al crear la transacción.' });
  }
};

// Obtener una transacción por ID
export const getTransactionById = async (req, res) => {
  const { id } = req.params;
  try {
    const transaction = await Finanzas.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transacción no encontrada.' });
    }
    res.json(transaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener la transacción.' });
  }
};

// Actualizar una transacción
export const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { type, category, description, amount, currency, exchangeRate, date } = req.body;

  try {
    const updateData = {
      type,
      category,
      description,
      amount,
      currency,
      exchangeRate,
      date
    };

    // Recalcular amountBOB si se actualiza amount, currency o exchangeRate
    if (amount !== undefined || currency !== undefined || exchangeRate !== undefined) {
      const currentTransaction = await Finanzas.findById(id);
      if (currentTransaction) {
        const finalAmount = amount !== undefined ? amount : currentTransaction.amount;
        const finalCurrency = currency !== undefined ? currency : currentTransaction.currency;
        const finalExchangeRate = exchangeRate !== undefined ? exchangeRate : currentTransaction.exchangeRate;
        updateData.amountBOB = finalCurrency === 'USD' ? finalAmount * finalExchangeRate : finalAmount;
      }
    }

    const updated = await Finanzas.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: 'Transacción no encontrada.' });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar la transacción.' });
  }
};

// Eliminar una transacción
export const deleteTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Finanzas.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Transacción no encontrada.' });

    res.json({ message: 'Transacción eliminada correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar la transacción.' });
  }
};

// Función para obtener métricas financieras
export const getFinancialMetrics = async (req, res) => {
  try {
    const { startDate, endDate, currency = 'BOB' } = req.query;

    let matchStage = {};
    if (startDate && endDate) {
      matchStage.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const metrics = await Finanzas.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalIngresos: {
            $sum: {
              $cond: [{ $eq: ['$type', 'ingreso'] }, '$amountBOB', 0]
            }
          },
          totalEgresos: {
            $sum: {
              $cond: [{ $eq: ['$type', 'egreso'] }, '$amountBOB', 0]
            }
          },
          countIngresos: {
            $sum: {
              $cond: [{ $eq: ['$type', 'ingreso'] }, 1, 0]
            }
          },
          countEgresos: {
            $sum: {
              $cond: [{ $eq: ['$type', 'egreso'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          balance: { $subtract: ['$totalIngresos', '$totalEgresos'] },
          totalIngresos: 1,
          totalEgresos: 1,
          countIngresos: 1,
          countEgresos: 1,
          utilidadNeta: { $subtract: ['$totalIngresos', '$totalEgresos'] }
        }
      }
    ]);

    const result = metrics[0] || {
      balance: 0,
      totalIngresos: 0,
      totalEgresos: 0,
      countIngresos: 0,
      countEgresos: 0,
      utilidadNeta: 0
    };

    // --- Agregado: Calcular Disponibilidad de Capital (Caja + Bancos) ---
    const accounts = await BankAccount.find({ isActive: true });
    const totalBanco = accounts.filter(a => a.tipo === 'banco').reduce((sum, a) => sum + a.saldo, 0);
    const totalEfectivo = accounts.filter(a => a.tipo === 'efectivo').reduce((sum, a) => sum + a.saldo, 0);

    result.capitalStats = {
      totalBanco,
      totalEfectivo,
      totalCapital: totalBanco + totalEfectivo
    };
    // -------------------------------------------------------------------

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Función para obtener flujo de caja
export const getCashFlow = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let groupBy;
    switch (period) {
      case 'day':
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        };
        break;
      case 'month':
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' }
        };
        break;
      case 'year':
        groupBy = {
          year: { $year: '$date' }
        };
        break;
      default:
        groupBy = {
          year: { $year: '$date' },
          month: { $month: '$date' }
        };
    }

    const cashFlow = await Finanzas.aggregate([
      {
        $group: {
          _id: groupBy,
          ingresos: {
            $sum: {
              $cond: [{ $eq: ['$type', 'ingreso'] }, '$amountBOB', 0]
            }
          },
          egresos: {
            $sum: {
              $cond: [{ $eq: ['$type', 'egreso'] }, '$amountBOB', 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          period: '$_id',
          ingresos: 1,
          egresos: 1,
          flujoNeto: { $subtract: ['$ingresos', '$egresos'] }
        }
      },
      { $sort: { 'period.year': -1, 'period.month': -1, 'period.day': -1 } }
    ]);

    res.json(cashFlow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Función para obtener el tipo de cambio actual
// Función para obtener el tipo de cambio actual
export const getExchangeRate = async (req, res) => {
  try {
    // En una implementación real, esto podría obtenerse de una API externa
    // Por ahora, devolveremos un valor fijo o configurable
    const exchangeRate = process.env.EXCHANGE_RATE || 6.96; // Tipo de cambio BOB/USD
    res.json({
      exchangeRate: exchangeRate,
      from: 'USD',
      to: 'BOB',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Función para obtener estadísticas generales (Dashboard)
export const getFinancialStatistics = async (req, res) => {
  try {
    const { year, period = 'year', month, week, date } = req.query;
    const selectedYear = parseInt(year) || new Date().getFullYear();

    let startDate, endDate;
    let groupBy = {};
    let sort = {};

    if (period === 'month') {
      const selectedMonth = (parseInt(month) || 1) - 1;
      startDate = new Date(selectedYear, selectedMonth, 1);
      endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      groupBy = { day: { $dayOfMonth: '$date' } };
      sort = { 'period.day': 1 };
    } else if (period === 'week') {
      const refDate = date ? new Date(date) : new Date();
      const day = refDate.getDay();
      const diff = refDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(refDate.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      groupBy = { day: { $dayOfMonth: '$date' }, dayOfWeek: { $dayOfWeek: '$date' } };
      sort = { 'period.day': 1 };
    } else {
      startDate = new Date(selectedYear, 0, 1);
      endDate = new Date(selectedYear, 11, 31, 23, 59, 59);
      groupBy = { year: { $year: '$date' }, month: { $month: '$date' } };
      sort = { 'period.month': 1 };
    }

    const metricsAggregation = await Finanzas.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          totalIngresos: { $sum: { $cond: [{ $eq: ['$type', 'ingreso'] }, '$amountBOB', 0] } },
          totalEgresos: { $sum: { $cond: [{ $eq: ['$type', 'egreso'] }, '$amountBOB', 0] } },
          countIngresos: { $sum: { $cond: [{ $eq: ['$type', 'ingreso'] }, 1, 0] } },
          countEgresos: { $sum: { $cond: [{ $eq: ['$type', 'egreso'] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          totalIngresos: 1,
          totalEgresos: 1,
          countIngresos: 1,
          countEgresos: 1,
          utilidadNeta: { $subtract: ['$totalIngresos', '$totalEgresos'] }
        }
      }
    ]);

    let metrics = metricsAggregation[0] || { totalIngresos: 0, totalEgresos: 0, countIngresos: 0, countEgresos: 0, utilidadNeta: 0 };

    const logisticaMetrics = await Logistica.aggregate([
      { $match: { fechaPedido: { $gte: startDate, $lte: endDate }, estado: { $ne: 'cancelado' } } },
      { $group: { _id: null, totalCostoEnvio: { $sum: "$costoEnvio" }, countEnvios: { $sum: 1 } } }
    ]);
    metrics.ingresosPorEnvio = 0;
    if (logisticaMetrics.length > 0) {
      metrics.totalIngresos += logisticaMetrics[0].totalCostoEnvio;
      metrics.countIngresos += logisticaMetrics[0].countEnvios;
      metrics.ingresosPorEnvio = logisticaMetrics[0].totalCostoEnvio;
    }

    const ventasBreakdown = await Venta.aggregate([
      { $match: { fecha: { $gte: startDate, $lte: endDate }, estado: { $ne: 'Anulado' } } },
      { $unwind: "$productos" },
      {
        $project: {
          _id: 1,
          tipoComprobante: 1,
          cantidad: "$productos.cantidad",
          precioTotal: "$productos.precioTotal",
          precioUnitario: "$productos.precioUnitario",
          costoUnitarioReal: { $ifNull: ["$productos.costoUnitario", 0] }
        }
      },
      {
        $addFields: {
          costoTotalProducto: { $multiply: ["$cantidad", "$costoUnitarioReal"] },
          ventaTotalProducto: { $multiply: ["$cantidad", "$precioUnitario"] }
        }
      },
      {
        $group: {
          _id: "$_id",
          tipoComprobante: { $first: "$tipoComprobante" },
          totalVenta: { $sum: "$ventaTotalProducto" },
          costoVenta: { $sum: "$costoTotalProducto" }
        }
      },
      {
        $group: {
          _id: "$tipoComprobante",
          total: { $sum: "$totalVenta" },
          count: { $sum: 1 },
          costoTotal: { $sum: "$costoVenta" }
        }
      }
    ]);
    metrics.ventasBreakdown = ventasBreakdown[0] || { total: 0, count: 0, costoTotal: 0 };

    const grossProfitAggregation = await Venta.aggregate([
      { $match: { fecha: { $gte: startDate, $lte: endDate }, estado: { $ne: 'Anulado' } } },
      { $unwind: '$productos' },
      {
        $group: {
          _id: null,
          totalVentas: { $sum: { $multiply: ['$productos.cantidad', '$productos.precioUnitario'] } },
          totalCosto: { $sum: { $multiply: ['$productos.cantidad', { $ifNull: ['$productos.costoUnitario', 0] }] } }
        }
      },
      { $project: { utilidadBrutaVentas: { $subtract: ['$totalVentas', '$totalCosto'] } } }
    ]);
    metrics.utilidadBrutaVentas = grossProfitAggregation[0] ? grossProfitAggregation[0].utilidadBrutaVentas : 0;

    const cashflow = await Finanzas.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: groupBy,
          ingresos: { $sum: { $cond: [{ $eq: ['$type', 'ingreso'] }, '$amountBOB', 0] } },
          egresos: { $sum: { $cond: [{ $eq: ['$type', 'egreso'] }, '$amountBOB', 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          period: '$_id',
          ingresos: 1,
          egresos: 1,
          flujoNeto: { $subtract: ['$ingresos', '$egresos'] },
          dateInfo: '$_id'
        }
      },
      { $sort: sort }
    ]);

    const salesDetail = await Venta.aggregate([
      { $match: { fecha: { $gte: startDate, $lte: endDate }, estado: { $ne: 'Anulado' } } },
      { $unwind: "$productos" },
      {
        $project: {
          fecha: 1,
          numVenta: 1,
          producto: "$productos.nombreProducto",
          codigo: "$productos.codigo",
          cantidad: "$productos.cantidad",
          precioVenta: "$productos.precioUnitario",
          costoCompra: { $ifNull: ["$productos.costoUnitario", 0] }
        }
      },
      {
        $addFields: {
          utilidadUnitario: { $subtract: ["$precioVenta", "$costoCompra"] },
          utilidadTotal: { $multiply: ["$cantidad", { $subtract: ["$precioVenta", "$costoCompra"] }] }
        }
      },
      { $sort: { fecha: -1, numVenta: -1 } },
      { $limit: 100 }
    ]);

    const groupByVenta = JSON.parse(JSON.stringify(groupBy).replace(/\$date/g, '$fecha'));
    const profitHistory = await Venta.aggregate([
      { $match: { fecha: { $gte: startDate, $lte: endDate }, estado: { $ne: 'Anulado' } } },
      { $unwind: '$productos' },
      {
        $group: {
          _id: groupByVenta,
          utilidad: { $sum: { $multiply: ['$productos.cantidad', { $subtract: ['$productos.precioUnitario', { $ifNull: ['$productos.costoUnitario', 0] }] }] } },
          ventas: { $sum: { $multiply: ['$productos.cantidad', '$productos.precioUnitario'] } }
        }
      },
      { $project: { _id: 0, period: '$_id', utilidad: 1, ventas: 1 } },
      { $sort: sort }
    ]);

    // NEW: Balance Sheet metrics
    const balanceStats = await getBalanceSheetStats(startDate, endDate);
    metrics = { ...metrics, ...balanceStats };

    res.json({
      metrics,
      cashflow,
      profitHistory,
      salesDetail,
      periodInfo: { startDate, endDate, type: period }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas financieras:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas financieras' });
  }
};

// Nueva función interna para métricas integrales que puede ser llamada desde getFinancialStatistics
const getBalanceSheetStats = async (startDate, endDate) => {
  // 1. Inversión en Maquinaria (Valor Total de Activos Fijos)
  const maquinas = await Maquina.find();
  const inversionMaquinaria = maquinas.reduce((acc, m) => acc + ((m.costo || 0) * (m.cantidad || 1)), 0);

  // 2. Costo Materiales e Inventario
  const materiasPrimas = await MateriaPrima.find({ activo: true });
  const costoMateriales = materiasPrimas.reduce((acc, mp) => acc + ((mp.precioCompra || 0) * (mp.cantidad || 0)), 0);

  const productosTerminados = await ProductoTienda.find({ activo: true, tipo: 'Producto Terminado' });
  const costoProductosTerminados = productosTerminados.reduce((acc, pt) => acc + ((pt.precioCompra || 0) * (pt.cantidad || 0)), 0);

  // 3. Cuentas por Cobrar (Saldos pendientes de clientes)
  const deudasVenta = await DeudaVenta.find({ estado: { $ne: 'Pagada' } });
  const cuentasPorCobrar = deudasVenta.reduce((acc, d) => acc + (d.saldoActual || 0), 0);

  // 4. Cuentas por Pagar (Saldos pendientes a proveedores)
  const deudasCompra = await DeudaCompra.find({ estado: { $ne: 'Pagada' } });
  const cuentasPorPagar = deudasCompra.reduce((acc, d) => acc + (d.saldoActual || 0), 0);

  // 5. Capital en Cuentas y Cajas
  const bankAccounts = await BankAccount.find({ isActive: true });
  const capitalCuentas = bankAccounts.reduce((acc, a) => acc + (a.saldo || 0), 0);

  // 6. Transferencias Internas en el Periodo
  const transferenciasPeriodo = await Finanzas.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        category: 'transferencia_interna'
      }
    },
    { $group: { _id: null, total: { $sum: "$amountBOB" } } }
  ]);
  const totalTransferencias = transferenciasPeriodo[0]?.total || 0;

  const totalActivos = capitalCuentas + inversionMaquinaria + costoMateriales + costoProductosTerminados + cuentasPorCobrar;

  return {
    inversionMaquinaria,
    costoMateriales,
    costoProductosTerminados,
    valorInventarioTotal: costoMateriales + costoProductosTerminados,
    cuentasPorCobrar,
    cuentasPorPagar,
    capitalCuentas,
    totalActivos,
    capitalTotal: totalActivos - cuentasPorPagar,
    totalTransferencias
  };
};

// Función para obtener rentabilidad por producto
// Función para obtener rentabilidad por producto (INCLUYENDO NO VENDIDOS)
export const getRentabilidadProductos = async (req, res) => {
  try {
    const { year, period, month, date, search } = req.query;

    let start = null;
    let end = null;

    if (year) {
      const y = parseInt(year);
      if (period === 'month' && month) {
        const m = parseInt(month) - 1; // JS months 0-11
        start = new Date(Date.UTC(y, m, 1, 0, 0, 0));
        end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));
      } else if (period === 'day' && date) {
        // Asumiendo que date viene 'YYYY-MM-DD' y queremos cubrir el día UTC completo
        // O mejor: interpretar la fecha local del usuario y cubrir ese rango
        const d = new Date(date);
        start = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0));
        end = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59));
      } else {
        start = new Date(Date.UTC(y, 0, 1, 0, 0, 0));
        end = new Date(Date.UTC(y, 11, 31, 23, 59, 59));
      }
    }

    const pipeline = [
      { $match: { activo: true } },

      ...(search ? [{
        $match: {
          $or: [
            { nombre: { $regex: search, $options: "i" } },
            { codigo: { $regex: search, $options: "i" } }
          ]
        }
      }] : []),

      {
        $lookup: {
          from: "ventas",
          let: { pid: "$_id" },
          pipeline: [
            { $unwind: "$productos" },
            {
              $match: {
                $expr: { $eq: ["$productos.producto", "$$pid"] },
                estado: { $ne: "Anulado" }
              }
            },
            ...(start && end ? [{
              $match: {
                fecha: {
                  $gte: start,
                  $lte: end
                }
              }
            }] : [])
          ],
          as: "ventasRealizadas"
        }
      },

      {
        $project: {
          nombre: 1,
          codigo: 1,
          imagen: 1,
          cantidadVendida: { $sum: "$ventasRealizadas.productos.cantidad" },
          ingresoTotal: { $sum: "$ventasRealizadas.productos.precioTotal" },
          costoTotal: {
            $sum: {
              $map: {
                input: "$ventasRealizadas",
                as: "v",
                in: {
                  $multiply: [
                    "$$v.productos.cantidad",
                    { $ifNull: ["$$v.productos.costoUnitario", 0] }
                  ]
                }
              }
            }
          }
        }
      },

      {
        $project: {
          nombre: 1,
          codigo: 1,
          imagen: 1,
          cantidadVendida: 1,
          ingresoTotal: 1,
          costoTotal: 1,
          utilidad: { $subtract: ["$ingresoTotal", "$costoTotal"] },
          margen: {
            $cond: [
              { $gt: ["$ingresoTotal", 0] },
              { $multiply: [{ $divide: [{ $subtract: ["$ingresoTotal", "$costoTotal"] }, "$ingresoTotal"] }, 100] },
              0
            ]
          }
        }
      },

      { $sort: { utilidad: -1, nombre: 1 } }
    ];

    const ProductoTiendaModel = mongoose.model("ProductoTienda");
    const resultados = await ProductoTiendaModel.aggregate(pipeline);

    res.json(resultados);

  } catch (error) {
    console.error("Error al obtener rentabilidad por producto:", error);
    res.status(500).json({ message: "Error al obtener reporte de rentabilidad" });
  }
};

// --- GESTIÓN DE DEUDAS (CUENTAS POR PAGAR) ---

// Obtener deudas pendientes
export const getDeudas = async (req, res) => {
  try {
    const deudas = await DeudaCompra.find({ estado: { $ne: 'Pagada' } })
      .populate('proveedor', 'nombre')
      .populate('compraId', 'numCompra fecha totalCompra')
      .sort({ fechaCreacion: -1 });
    res.json(deudas);
  } catch (error) {
    import('fs').then(fs => {
      fs.appendFileSync('error.log', `[${new Date().toISOString()}] Error en getDeudas: ${error.stack}\n`);
    });
    console.error('Error al obtener deudas:', error);
    res.status(500).json({ message: 'Error al obtener las cuentas por pagar.', error: error.message });
  }
};

// Registrar pago de deuda
export const registrarPagoDeuda = async (req, res) => {
  const { deudaId, monto, tipoPago, cuenta, referencia } = req.body;

  if (!deudaId || !monto || !tipoPago) {
    return res.status(400).json({ message: 'Faltan datos requeridos (deudaId, monto, tipoPago).' });
  }

  try {
    const deuda = await DeudaCompra.findById(deudaId).populate('proveedor');
    if (!deuda) {
      return res.status(404).json({ message: 'Deuda no encontrada.' });
    }

    if (monto > deuda.saldoActual) {
      return res.status(400).json({ message: 'El monto a pagar excede el saldo actual.' });
    }

    // 1. Actualizar Deuda
    deuda.montoPagado += parseFloat(monto);
    deuda.saldoActual -= parseFloat(monto);

    // Determinar nuevo estado
    if (deuda.saldoActual <= 0.01) { // Margen de error por decimales
      deuda.saldoActual = 0;
      deuda.estado = 'Pagada';
    } else {
      deuda.estado = 'Parcialmente Pagada';
    }

    // Agregar al historial
    deuda.historialPagos.push({
      monto: parseFloat(monto),
      tipoPago,
      referencia,
      cuenta,
      fechaPago: new Date()
    });

    await deuda.save();

    // 2. Registrar Transacción en Finanzas (Egreso)
    const descripcion = `Pago de deuda a ${deuda.proveedor.nombre} (Ref: ${referencia || 'S/N'})`;
    await registrarTransaccionFinanciera(
      'egreso',
      'compra_productos', // O 'pago_deuda' si existiera esa categoría
      descripcion,
      parseFloat(monto),
      deuda.compraId, // Referencia a la compra original si es posible, o a la deuda
      'Compra', // Modelo referenciado
      {
        metodoPago: tipoPago,
        banco: cuenta,
        deudaId: deuda._id
      }
    );

    res.json({ message: 'Pago registrado exitosamente', deuda });

  } catch (error) {
    console.error('Error al registrar pago de deuda:', error);
    res.status(500).json({ message: 'Error al procesar el pago de la deuda.' });
  }
};

// --- GESTIÓN DE CUENTAS BANCARIAS ---

// Crear nueva cuenta bancaria
export const createAccount = async (req, res) => {
  try {
    const { nombreBanco, numeroCuenta, saldoInicial, tipo = 'banco' } = req.body; // Default tipo to banco

    if (!nombreBanco || !numeroCuenta) {
      return res.status(400).json({ message: "Nombre del banco y número de cuenta son obligatorios." });
    }

    const existingAccount = await BankAccount.findOne({ numeroCuenta });
    if (existingAccount) {
      return res.status(400).json({ message: "Ya existe una cuenta con este número." });
    }

    const newAccount = new BankAccount({
      nombreBanco,
      numeroCuenta,
      saldo: saldoInicial || 0,
      tipo // Add tipo
    });

    await newAccount.save();

    // Si hay saldo inicial, registrar como depósito inicial
    if (saldoInicial > 0) {
      const transaction = new BankTransaction({
        cuentaId: newAccount._id,
        tipo: 'Deposito',
        monto: saldoInicial,
        descripcion: 'Saldo Inicial',
        fecha: new Date()
      });
      await transaction.save();
    }

    res.status(201).json(newAccount);
  } catch (error) {
    console.error("Error al crear cuenta bancaria:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Ya existe una cuenta con este número." });
    }
    res.status(500).json({ message: "Error al crear la cuenta bancaria." });
  }
};

// Obtener todas las cuentas activas
export const getAccounts = async (req, res) => {
  try {
    const accounts = await BankAccount.find({ isActive: true }).sort({ fechaCreacion: -1 });
    res.json(accounts);
  } catch (error) {
    console.error("Error al obtener cuentas bancarias:", error);
    res.status(500).json({ message: "Error al obtener las cuentas bancarias." });
  }
};

// Actualizar cuenta (incluyendo Soft Delete y Transferencia de Saldo)
// Actualizar cuenta (incluyendo Soft Delete y Transferencia de Saldo)
export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreBanco, numeroCuenta, isActive, transferToAccountId } = req.body;

    const account = await BankAccount.findById(id);
    if (!account) {
      return res.status(404).json({ message: "Cuenta no encontrada." });
    }

    // Checking if new numeroCuenta conflicts with another account
    if (numeroCuenta && numeroCuenta !== account.numeroCuenta) {
      const existing = await BankAccount.findOne({ numeroCuenta });
      if (existing) {
        return res.status(400).json({ message: "Ya existe otra cuenta con este número." });
      }
      account.numeroCuenta = numeroCuenta;
    }

    // Si se está desactivando y tiene saldo, verificar transferencia
    if (isActive === false && account.saldo > 0) {
      if (!transferToAccountId) {
        return res.status(400).json({
          message: "La cuenta tiene saldo pendiente. Debe especificar una cuenta destino para transferir los fondos antes de desactivarla."
        });
      }

      const targetAccount = await BankAccount.findById(transferToAccountId);
      if (!targetAccount) {
        return res.status(404).json({ message: "Cuenta destino no encontrada." });
      }

      if (!targetAccount.isActive) {
        return res.status(400).json({ message: "La cuenta destino debe estar activa." });
      }

      // Realizar transferencia
      const montoTransferencia = account.saldo;

      // 1. Retiro de cuenta origen (cierre)
      account.saldo = 0;
      const retiroTx = new BankTransaction({
        cuentaId: account._id,
        tipo: 'Retiro',
        monto: montoTransferencia,
        descripcion: `Transferencia por cierre de cuenta a ${targetAccount.nombreBanco}`,
        fecha: new Date()
      });
      await retiroTx.save();

      // 2. Depósito a cuenta destino
      targetAccount.saldo += montoTransferencia;
      const depositoTx = new BankTransaction({
        cuentaId: targetAccount._id,
        tipo: 'Deposito',
        monto: montoTransferencia,
        descripcion: `Transferencia por cierre de cuenta desde ${account.nombreBanco}`,
        fecha: new Date()
      });
      await depositoTx.save();
      await targetAccount.save();

      // 3. Registrar en Finanzas (Movimiento interno - opcional, o solo log)
      console.log(`[FINANZAS] Transferencia por cierre: ${montoTransferencia} de ${account.nombreBanco} a ${targetAccount.nombreBanco}`);
    }

    if (nombreBanco) account.nombreBanco = nombreBanco;
    if (isActive !== undefined) account.isActive = isActive;

    await account.save();
    res.json(account);
  } catch (error) {
    console.error("Error al actualizar cuenta bancaria:", error);
    res.status(500).json({ message: "Error al actualizar la cuenta bancaria." });
  }
};

// Agregar Depósito
export const addDeposit = async (req, res) => {
  try {
    const { cuentaId, monto, descripcion, comprobanteUrl } = req.body;

    if (!cuentaId || !monto || monto <= 0) {
      return res.status(400).json({ message: "Cuenta y monto válido son obligatorios." });
    }

    const account = await BankAccount.findById(cuentaId);
    if (!account) {
      return res.status(404).json({ message: "Cuenta no encontrada." });
    }

    // Actualizar saldo
    account.saldo += parseFloat(monto);
    await account.save();

    // Registrar transacción bancaria
    const transaction = new BankTransaction({
      cuentaId,
      tipo: 'Deposito',
      monto: parseFloat(monto),
      descripcion: descripcion || 'Depósito Manual',
      comprobanteUrl,
      fecha: new Date()
    });
    await transaction.save();

    // Registrar también en Finanzas General como Ingreso
    await registrarTransaccionFinanciera(
      'ingreso',
      'otros_ingresos',
      `Depósito a ${account.nombreBanco} (${account.numeroCuenta}) - ${descripcion || ''}`,
      parseFloat(monto),
      transaction._id,
      'BankTransaction',
      { banco: account.nombreBanco, cuenta: account.numeroCuenta },
      'BOB',
      1
    );

    res.json({ message: "Depósito registrado correctamente.", account, transaction });
  } catch (error) {
    console.error("Error al registrar depósito:", error);
    res.status(500).json({ message: "Error al registrar el depósito." });
  }
};

// Obtener historial de transacciones de una cuenta
export const getAccountTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const transactions = await BankTransaction.find({ cuentaId: id }).sort({ fecha: -1 });
    res.json(transactions);
  } catch (error) {
    console.error("Error al obtener historial bancario:", error);
    res.status(500).json({ message: "Error al obtener el historial." });
  }
};

// Transferir fondos entre cuentas
export const transferFunds = async (req, res) => {
  const { sourceAccountId, targetAccountId, amount, description, date } = req.body;

  if (!sourceAccountId || !targetAccountId || !amount || amount <= 0) {
    return res.status(400).json({ message: 'Datos incompletos o inválidos.' });
  }

  if (sourceAccountId === targetAccountId) {
    return res.status(400).json({ message: 'La cuenta de origen y destino no pueden ser la misma.' });
  }

  try {
    const sourceAccount = await BankAccount.findById(sourceAccountId);
    const targetAccount = await BankAccount.findById(targetAccountId);

    if (!sourceAccount || !targetAccount) {
      throw new Error('Cuenta de origen o destino no encontrada.');
    }

    if (sourceAccount.saldo < amount) {
      throw new Error('Saldo insuficiente en la cuenta de origen.');
    }

    // 1. Descontar de Origen
    sourceAccount.saldo -= parseFloat(amount);
    await sourceAccount.save();

    // 2. Aumentar a Destino
    targetAccount.saldo += parseFloat(amount);
    await targetAccount.save();

    // 3. Registrar Movimientos Bancarios
    const txDate = date || new Date();

    // Retiro
    await new BankTransaction({
      cuentaId: sourceAccountId,
      tipo: 'Retiro',
      monto: amount,
      fecha: txDate,
      descripcion: `Transferencia a ${targetAccount.nombreBanco} - ${description || ''}`,
    }).save();

    // Deposito
    await new BankTransaction({
      cuentaId: targetAccountId,
      tipo: 'Deposito',
      monto: amount,
      fecha: txDate,
      descripcion: `Transferencia desde ${sourceAccount.nombreBanco} - ${description || ''}`,
    }).save();

    // 4. Registrar en Finanzas (solo informativo, no P&L si se filtra por type)
    // Opcional: Si queremos que aparezca en el historial global "neutro".
    await new Finanzas({
      type: 'transferencia',
      category: 'transferencia_interna',
      description: `Transferencia: ${sourceAccount.nombreBanco} -> ${targetAccount.nombreBanco} | ${description}`,
      amount: amount,
      currency: 'BOB',
      amountBOB: amount,
      date: txDate,
      metadata: {
        sourceAccount: sourceAccount.nombreBanco,
        targetAccount: targetAccount.nombreBanco,
        transfer: true
      }
    }).save();

    res.json({ message: 'Transferencia realizada con éxito.' });

  } catch (error) {
    console.error('Error en transferencia:', error);
    res.status(400).json({ message: error.message || 'Error al procesar la transferencia.' });
  }
};
