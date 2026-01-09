import mongoose from 'mongoose';
import Compra from '../models/compra.model.js';
import ProductoTienda from '../models/productoTienda.model.js';
import BankAccount from '../models/bankAccount.model.js';
import BankTransaction from '../models/bankTransaction.model.js';
import Finanzas from '../models/finanzas.model.js';
import { deleteCompra } from '../controllers/compras.controller.js';

// MOCK res object
const mockRes = {
    status: function (code) {
        console.log(`Response Status: ${code}`);
        return this;
    },
    json: function (data) {
        console.log("Response JSON:", JSON.stringify(data, null, 2));
        return this;
    }
};

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/mueblesDB');
        console.log('Connected to MongoDB');

        // PRE-CLEANUP
        await BankAccount.findOneAndDelete({ numeroCuenta: '123-REV' });
        await ProductoTienda.findOneAndDelete({ codigo: 'TP-REV' });

        // 1. Setup Data
        // Create Account
        let account = await BankAccount.create({
            nombreBanco: 'Test Bank Reversal',
            numeroCuenta: '123-REV',
            tipo: 'banco',
            saldo: 1000,
            isActive: true
        });
        console.log(`[SETUP] Account Created: ${account.nombreBanco}, Balance: ${account.saldo}`);

        // Create Product
        let product = await ProductoTienda.create({
            nombre: 'Test Product Reversal',
            codigo: 'TP-REV',
            cantidad: 50,
            precioCompra: 10,
            precioVenta: 20,
            categoria: 'Test',
            color: 'Red'
        });
        console.log(`[SETUP] Product Created: ${product.nombre}, Stock: ${product.cantidad}`);

        // Create Purchase (Simulate Buying 10 units for 100 Bs)
        // Note: For Compra, we assume the money was ALREADY deducted when created. 
        // So we manually deduct balance and add stock to simulate "Purchase made".

        // Simulating the effect of a Purchase:
        account.saldo -= 100;
        await account.save();
        product.cantidad += 10;
        await product.save();
        console.log(`[ACTION] Purchase Simulated (-100 Bs, +10 Stock)`);
        console.log(`[STATE] Account Balance: ${account.saldo}, Product Stock: ${product.cantidad}`);

        // Create Provider
        // We need a dummy provider model or just bypass if we can, but Mongoose strict might demand it if we had a Provider model import.
        // Since we don't import Provider model here, we can't create it easily unless we assume a collection.
        // Let's just use a valid ObjectId and hope ref check isn't enforcement.
        const fakeProviderId = new mongoose.Types.ObjectId();

        const compra = await Compra.create({
            numCompra: 'TEST-REV-001',
            fecha: new Date(),
            tipoCompra: 'Producto Terminado',
            proveedor: fakeProviderId,
            productos: [{
                producto: product._id,
                cantidad: 10,
                precioUnitario: 10,
                nombreProducto: product.nombre,
                codigo: product.codigo,
                onModel: 'ProductoTienda',
                codigoProveedor: 'PROV-001'
            }],
            metodosPago: [{
                tipo: 'Transferencia',
                monto: 100,
                cuentaId: account._id,
                cuenta: 'Test Account'
            }],
            totalCompra: 100
        });
        console.log(`[SETUP] Purchase Record Created: ${compra._id}`);

        // 2. Execute Delete (Reversal)
        console.log('\n[TEST] Executing deleteCompra...');
        const req = { params: { id: compra._id } };
        await deleteCompra(req, mockRes);

        // 3. Verify Results
        const updatedAccount = await BankAccount.findById(account._id);
        const updatedProduct = await ProductoTienda.findById(product._id);
        const deletedCompra = await Compra.findById(compra._id);

        console.log('\n[VERIFICATION]');
        console.log(`Account Balance (Expected 1000): ${updatedAccount ? updatedAccount.saldo : 'ERROR'}`);
        console.log(`Product Stock (Expected 50): ${updatedProduct ? updatedProduct.cantidad : 'ERROR'}`);
        console.log(`Purchase Record (Expected null): ${deletedCompra}`);

        if (updatedAccount && updatedAccount.saldo === 1000 && updatedProduct && updatedProduct.cantidad === 50 && !deletedCompra) {
            console.log('✅ TEST PASSED: Full Reversal Successful');
        } else {
            console.log('❌ TEST FAILED: Discrepancies found');
        }

        // Cleanup
        if (updatedAccount) await BankAccount.findByIdAndDelete(account._id);
        if (updatedProduct) await ProductoTienda.findByIdAndDelete(product._id);

    } catch (error) {
        console.error('Error Details:', JSON.stringify(error, null, 2));
    } finally {
        await mongoose.disconnect();
    }
};

run();
