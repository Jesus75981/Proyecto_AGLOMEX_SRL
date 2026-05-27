import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración de rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Modelos
import Finanzas from '../models/finanzas.model.js';
import Venta from '../models/venta.model.js';
import Compra from '../models/compra.model.js';
import BankAccount from '../models/bankAccount.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesdb';

async function migrarTransacciones() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado a MongoDB para migración...');

        // 1. Buscar transacciones en Finanzas que no tengan metadata.cuentaId
        const transaccionesSinCuenta = await Finanzas.find({
            $or: [
                { 'metadata.cuentaId': { $exists: false } },
                { 'metadata.cuentaId': null }
            ]
        });

        console.log(`Encontradas ${transaccionesSinCuenta.length} transacciones sin cuenta vinculada.`);

        let vinculadas = 0;
        let manuales = 0;

        for (const tx of transaccionesSinCuenta) {
            let cuentaId = null;
            let cuentaNombre = '';

            // CASO A: Venta
            if (tx.referenceModel === 'Venta' && tx.referenceId) {
                const venta = await Venta.findById(tx.referenceId);
                if (venta && venta.metodosPago && venta.metodosPago.length > 0) {
                    // Tomar la primera cuenta válida del pago
                    const pagoConCuenta = venta.metodosPago.find(p => p.cuentaId);
                    if (pagoConCuenta) {
                        cuentaId = pagoConCuenta.cuentaId;
                    }
                }
            }
            // CASO B: Compra
            else if (tx.referenceModel === 'Compra' && tx.referenceId) {
                const compra = await Compra.findById(tx.referenceId);
                if (compra && compra.metodosPago && compra.metodosPago.length > 0) {
                    const pagoConCuenta = compra.metodosPago.find(p => p.cuentaId);
                    if (pagoConCuenta) {
                        cuentaId = pagoConCuenta.cuentaId;
                    }
                }
            }

            // CASO C: Transacciones Manuales (Intentar por metadatos pre-existentes o descripción)
            if (!cuentaId && tx.metadata && tx.metadata.cuentaId) {
                cuentaId = tx.metadata.cuentaId;
            }

            // Si encontramos una cuenta, actualizar la transacción
            if (cuentaId) {
                const banco = await BankAccount.findById(cuentaId);
                if (banco) {
                    tx.metadata = {
                        ...tx.metadata,
                        cuentaId: banco._id,
                        cuenta: `${banco.nombreBanco} - ${banco.tipo === 'efectivo' ? 'Caja' : banco.numeroCuenta}`,
                        banco: banco.nombreBanco
                    };
                    await tx.save();
                    vinculadas++;
                }
            } else {
                manuales++;
            }
        }

        console.log(`Migración completada:`);
        console.log(`- ${vinculadas} transacciones vinculadas a sus cuentas.`);
        console.log(`- ${manuales} transacciones no pudieron vincularse automáticamente (requieren revisión).`);

    } catch (error) {
        console.error('Error durante la migración:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrarTransacciones();
