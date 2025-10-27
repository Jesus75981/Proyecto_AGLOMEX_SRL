// controllers/finanzas.controller.js
import Finanzas from '../models/finanzas.model.js';
import Venta from '../models/venta.model.js';
import Compra from '../models/compra.model.js';
import Anticipo from '../models/anticipo.model.js';

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
    const { type, category, description, amount, currency, exchangeRate, date } = req.body;

    if (!type || !category || !description || !amount) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        const newTransaction = new Finanzas({
            type,
            category,
            description,
            amount,
            currency: currency || 'BOB',
            exchangeRate: exchangeRate || 1,
            amountBOB: currency === 'USD' ? amount * (exchangeRate || 1) : amount,
            date: date || Date.now()
        });
        await newTransaction.save();
        res.status(201).json(newTransaction);
    } catch (err) {
        console.error(err);
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
