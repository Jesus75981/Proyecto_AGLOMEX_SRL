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
    getExchangeRate,
    getFinancialStatistics,
    getDeudas,
    registrarPagoDeuda,
    createAccount,
    getAccounts,
    updateAccount,
    addDeposit,
    getAccountTransactions
} from '../controllers/finanzas.controller.js';

import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rutas adicionales para reportes y resumenes (deben ir antes de las rutas con parámetros)
router.get('/resumen', verifyToken, isAdmin, async (req, res) => {
    try {
        console.log('Solicitando resumen financiero...');
        const transactions = await Finanzas.find();
        console.log(`Encontradas ${transactions.length} transacciones.`);

        const ingresos = transactions.filter(t => t.type === 'ingreso').reduce((sum, t) => sum + (t.amountBOB || 0), 0);
        const egresos = transactions.filter(t => t.type === 'egreso').reduce((sum, t) => sum + (t.amountBOB || 0), 0);
        const balance = ingresos - egresos;

        console.log('Resumen calculado:', { ingresos, egresos, balance });

        res.json({
            mensaje: 'Resumen financiero',
            data: { ingresos, egresos, balance }
        });
    } catch (err) {
        import('fs').then(fs => {
            fs.appendFileSync('error.log', `[${new Date().toISOString()}] Error en /resumen: ${err.stack}\n`);
        });
        console.error('Error en /resumen:', err);
        res.status(500).json({ message: 'Error al obtener resumen.', error: err.message });
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
router.get('/estadisticas', getFinancialStatistics);

// Rutas para deudas (Cuentas por Pagar)
router.get('/deudas', getDeudas);
router.post('/deudas/pagar', registrarPagoDeuda);

// Rutas para Cuentas Bancarias
router.post('/cuentas', createAccount);
router.get('/cuentas', getAccounts);
router.put('/cuentas/:id', updateAccount);
router.post('/cuentas/deposito', addDeposit);
router.get('/cuentas/:id/transacciones', getAccountTransactions);

// Rutas para transacciones financieras
router.get('/', getTransactions); // Obtener todas las transacciones
router.post('/', createTransaction); // Crear nueva transacción
router.get('/:id', getTransactionById); // Obtener transacción por ID
router.put('/:id', updateTransaction); // Actualizar transacción
router.delete('/:id', deleteTransaction); // Eliminar transacción

export default router;
