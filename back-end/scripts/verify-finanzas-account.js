
import mongoose from 'mongoose';
import Finanzas from '../models/finanzas.model.js';
import BankAccount from '../models/bankAccount.model.js';
import BankTransaction from '../models/bankTransaction.model.js';
import { createTransaction } from '../controllers/finanzas.controller.js';

// Mock Response object
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

// Mock Request object
const mockReq = (body) => ({ body });

const runTest = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/muebles_db');
        console.log('Connected to MongoDB');

        // 1. Create a Test Bank Account
        const testAccount = new BankAccount({
            nombreBanco: 'Test Bank',
            numeroCuenta: 'TEST-123',
            tipo: 'banco',
            saldo: 1000,
            isActive: true
        });
        await testAccount.save();
        console.log(`Created Test Account: ${testAccount._id} with Balance: ${testAccount.saldo}`);

        // 2. Execute Manual Income (Ingreso)
        console.log('--- Testing Income (Ingreso) ---');
        const reqIngreso = mockReq({
            type: 'ingreso',
            category: 'ingreso_manual',
            description: 'Test Ingreso Manual',
            amount: 500,
            currency: 'BOB',
            date: new Date(),
            cuentaId: testAccount._id
        });
        const resIngreso = mockRes();

        // We need to call the controller directly. 
        // Note: controller uses `req.body` and returns via `res`.
        await createTransaction(reqIngreso, resIngreso);

        if (resIngreso.statusCode && resIngreso.statusCode !== 201) {
            console.error('Failed to create Income:', resIngreso.data);
            throw new Error('Income creation failed');
        }
        console.log('Income Transaction Created:', resIngreso.data._id);

        // 3. Verify Balance Increase
        const updatedAccount1 = await BankAccount.findById(testAccount._id);
        console.log(`Balance after Income (Expected 1500): ${updatedAccount1.saldo}`);
        if (updatedAccount1.saldo !== 1500) throw new Error('Balance mismatch after Income');

        // 4. Execute Manual Expense (Egreso)
        console.log('--- Testing Expense (Egreso) ---');
        const reqEgreso = mockReq({
            type: 'egreso',
            category: 'egreso_manual',
            description: 'Test Egreso Manual',
            amount: 200,
            currency: 'BOB',
            date: new Date(),
            cuentaId: testAccount._id
        });
        const resEgreso = mockRes();

        await createTransaction(reqEgreso, resEgreso);

        if (resEgreso.statusCode && resEgreso.statusCode !== 201) {
            console.error('Failed to create Expense:', resEgreso.data);
            throw new Error('Expense creation failed');
        }
        console.log('Expense Transaction Created:', resEgreso.data._id);

        // 5. Verify Balance Decrease
        const updatedAccount2 = await BankAccount.findById(testAccount._id);
        console.log(`Balance after Expense (Expected 1300): ${updatedAccount2.saldo}`);
        if (updatedAccount2.saldo !== 1300) throw new Error('Balance mismatch after Expense');

        // 6. Verify Bank Transactions
        const bankTxs = await BankTransaction.find({ cuentaId: testAccount._id });
        console.log(`Bank Transactions found: ${bankTxs.length} (Expected 2)`);
        if (bankTxs.length !== 2) throw new Error('BankTransaction count mismatch');

        console.log('SUCCESS: All checks passed!');

        // Cleanup
        await Finanzas.deleteMany({ 'metadata.cuentaId': testAccount._id });
        await BankTransaction.deleteMany({ cuentaId: testAccount._id });
        await BankAccount.findByIdAndDelete(testAccount._id);
        console.log('Cleanup completed');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
