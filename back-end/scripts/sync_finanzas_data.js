
import mongoose from 'mongoose';
import Venta from '../models/venta.model.js';
import Compra from '../models/compra.model.js';
import Finanzas from '../models/finanzas.model.js';

// Hardcoded URI to avoid dotenv issues
const MONGODB_URI = 'mongodb://localhost:27017/mueblesDB';

const syncFinanzas = async () => {
    try {
        console.log('Connecting to MongoDB...', MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        // --- SYNC SALES ---
        console.log('Syncing Sales...');
        const ventas = await Venta.find();
        let salesSynced = 0;

        for (const venta of ventas) {
            const exists = await Finanzas.findOne({ referenceId: venta._id, referenceModel: 'Venta' });
            if (!exists) {
                // Calculate total
                let totalVenta = 0;
                if (venta.productos && venta.productos.length > 0) {
                    totalVenta = venta.productos.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
                }

                // Calculate paid amount
                let paidAmount = 0;
                if (venta.metodosPago && Array.isArray(venta.metodosPago) && venta.metodosPago.length > 0) {
                    paidAmount = venta.metodosPago.reduce((sum, pago) => {
                        return (pago.tipo !== 'Crédito') ? sum + (pago.monto || 0) : sum;
                    }, 0);
                } else {
                    const saldo = venta.saldoPendiente || 0;
                    paidAmount = Math.max(0, totalVenta - saldo);
                }

                if (paidAmount > 0) {
                    const newFinance = new Finanzas({
                        type: 'ingreso',
                        category: 'venta_productos',
                        description: `Ingreso por Venta #${venta.numVenta} (Sincronizado)`,
                        amount: paidAmount,
                        currency: 'BOB',
                        exchangeRate: 1,
                        amountBOB: paidAmount,
                        referenceId: venta._id,
                        referenceModel: 'Venta',
                        date: venta.fecha || new Date(),
                        metadata: { synced: true, numVenta: venta.numVenta }
                    });
                    await newFinance.save();
                    salesSynced++;
                }
            }
        }
        console.log(`Synced ${salesSynced} sales transactions.`);

        // --- SYNC PURCHASES ---
        console.log('Syncing Purchases...');
        const compras = await Compra.find();
        let purchasesSynced = 0;

        for (const compra of compras) {
            const exists = await Finanzas.findOne({ referenceId: compra._id, referenceModel: 'Compra' });
            if (!exists) {
                // Calculate paid amount
                let paidAmount = 0;
                if (compra.metodosPago && Array.isArray(compra.metodosPago) && compra.metodosPago.length > 0) {
                    paidAmount = compra.metodosPago.reduce((sum, pago) => {
                        return (pago.tipo !== 'Crédito') ? sum + (pago.monto || 0) : sum;
                    }, 0);
                } else {
                    // Fallback
                    const total = compra.totalCompra || 0;
                    const saldo = compra.saldoPendiente || 0;
                    paidAmount = Math.max(0, total - saldo);
                }

                if (paidAmount > 0) {
                    const newFinance = new Finanzas({
                        type: 'egreso',
                        category: compra.tipoCompra === 'Materia Prima' ? 'compra_materias' : 'compra_productos',
                        description: `Pago de Compra #${compra.numCompra} (Sincronizado)`,
                        amount: paidAmount,
                        currency: 'BOB',
                        exchangeRate: 1,
                        amountBOB: paidAmount,
                        referenceId: compra._id,
                        referenceModel: 'Compra',
                        date: compra.fecha || new Date(),
                        metadata: { synced: true, numCompra: compra.numCompra }
                    });
                    await newFinance.save();
                    purchasesSynced++;
                }
            }
        }
        console.log(`Synced ${purchasesSynced} purchase transactions.`);

        console.log('Done.');
        process.exit(0);

    } catch (error) {
        console.error('Error syncing finances:', error);
        process.exit(1);
    }
};

syncFinanzas();
