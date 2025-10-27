// routes/finanzas.routes.js
import express from 'express';
import Finanzas from '../models/finanzas.model.js';
import {
    getTransactions,
    createTransaction,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    getFinancialMetrics,
    getCashFlow,
    getExchangeRate
} from '../controllers/finanzas.controller.js';

const router = express.Router();

// Middleware opcional para control de roles
const adminOnly = (req, res, next) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. Solo admins.' });
    }
    next();
};

// Rutas adicionales para reportes y resumenes (deben ir antes de las rutas con parámetros)
router.get('/resumen', adminOnly, async (req, res) => {
    try {
        const transactions = await Finanzas.find();
        const ingresos = transactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + t.amountBOB, 0);
        const egresos = transactions.filter(t => t.type === 'egreso').reduce((sum, t) => sum + t.amountBOB, 0);
        const balance = ingresos - egresos;

        res.json({
            mensaje: 'Resumen financiero',
            data: { ingresos, egresos, balance }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener resumen.' });
    }
});

router.get('/historial', (req, res) => {
    res.json({
        mensaje: 'Historial financiero accesible para todos los usuarios',
        data: []
    });
});

// Nueva ruta para obtener el tipo de cambio
router.get('/exchange-rate', getExchangeRate);

// Nuevas rutas para métricas y análisis financiero
router.get('/metrics', getFinancialMetrics);
router.get('/cashflow', getCashFlow);

// Rutas para transacciones financieras
router.get('/', getTransactions); // Obtener todas las transacciones
router.post('/', createTransaction); // Crear nueva transacción
router.get('/:id', getTransactionById); // Obtener transacción por ID
router.put('/:id', updateTransaction); // Actualizar transacción
router.delete('/:id', deleteTransaction); // Eliminar transacción

export default router;
