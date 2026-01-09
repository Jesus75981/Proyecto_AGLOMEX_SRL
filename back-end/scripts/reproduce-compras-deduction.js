
import mongoose from 'mongoose';
import Compra from '../models/compra.model.js';
import BankAccount from '../models/bankAccount.model.js';
import ProductoTienda from '../models/productoTienda.model.js';
import Proveedor from '../models/proveedores.model.js';
import BankTransaction from '../models/bankTransaction.model.js';
import { createCompra } from '../controllers/compras.controller.js';

// Mock Response
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

// Mock Request
const mockReq = (body) => ({ body });

const runTest = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/mueblesDB');
        console.log('Connected to MongoDB');

        // 1. Setup Data
        // Create Cash Account
        const cashAccount = new BankAccount({
            nombreBanco: 'Caja Chica Test',
            numeroCuenta: 'CASH-TEST',
            tipo: 'efectivo',
            saldo: 1000,
            isActive: true
        });
        await cashAccount.save();
        console.log(`Created Cash Account: ${cashAccount._id} (Balance: ${cashAccount.saldo})`);

        // Create Provider
        const provider = new Proveedor({
            nombre: 'Proveedor Test',
            contacto: { telefono: '123', email: 'test@test.com' }
        });
        await provider.save();

        // Create Product
        const product = new ProductoTienda({
            nombre: 'Producto Test',
            codigo: 'PROD-TEST',
            precioCompra: 10,
            categoria: 'Test',
            color: 'Red',
            idProductoTienda: 'PROD-TEST-ID'
        });
        await product.save();


        // 2. Simulate Purchase with Cash
        const reqBody = {
            tipoCompra: 'Producto Terminado',
            proveedor: provider._id,
            numeroFactura: 'FAC-123',
            productos: [{
                producto: product._id,
                cantidad: 10,
                precioUnitario: 50,
                nombreProducto: product.nombre, // Required by controller validation
                colorProducto: product.color,
                categoriaProducto: product.categoria
            }],
            metodosPago: [{
                tipo: 'Efectivo',
                monto: 500,
                cuentaId: cashAccount._id.toString() // Explicitly sending cuentaId
            }],
            totalCompra: 500
        };

        const req = mockReq(reqBody);
        const res = mockRes();

        console.log('Executing createCompra...');
        await createCompra(req, res);

        if (res.statusCode && res.statusCode !== 201) {
            console.error('Create Compra Failed:', res.data);
            throw new Error('Purchase creation failed');
        }

        const purchase = res.data.compra;
        console.log(`Purchase Created: ${purchase.numCompra}`);

        // 3. Verify Balance Deduction
        const updatedCashAccount = await BankAccount.findById(cashAccount._id);
        console.log(`Balance After Purchase (Expected 500): ${updatedCashAccount.saldo}`);

        if (updatedCashAccount.saldo !== 500) {
            console.error('FAILURE: Balance was not deducted!');
        } else {
            console.log('SUCCESS: Balance deducted correctly.');
        }

        // Cleanup
        await Compra.findByIdAndDelete(purchase._id);
        await BankAccount.findByIdAndDelete(cashAccount._id);
        await Proveedor.findByIdAndDelete(provider._id);
        await ProductoTienda.findByIdAndDelete(product._id);
        await BankTransaction.deleteMany({ cuentaId: cashAccount._id });

    } catch (error) {
        console.error('Test Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
