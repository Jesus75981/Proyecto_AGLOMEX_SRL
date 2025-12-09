import mongoose from 'mongoose';
import Compra from '../models/compra.model.js';
import MateriaPrima from '../models/materiaPrima.model.js';
import ProductoTienda from '../models/productoTienda.model.js';
import Proveedor from '../models/proveedores.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/aglomex_db";

async function runTest() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Create Dummy Provider
        const proveedor = await Proveedor.create({
            nombre: 'Test Provider ' + Date.now(),
            nit: '123456789',
            contacto: { telefono: '1234567', email: 'test@example.com' }
        });
        console.log('Provider created:', proveedor._id);

        // 2. Create Dummy Raw Material
        const materiaPrima = await MateriaPrima.create({
            idMateriaPrima: 'MP-' + Date.now(),
            nombre: 'Test Materia Prima ' + Date.now(),
            cantidad: 10,
            precioCompra: 100,
            precioVenta: 150
        });
        console.log('Materia Prima created:', materiaPrima._id);

        // 3. Create Dummy Finished Product
        const productoTienda = await ProductoTienda.create({
            idProductoTienda: 'PT-' + Date.now(),
            nombre: 'Test Producto Terminado ' + Date.now(),
            codigo: 'PT-CODE-' + Date.now(),
            color: 'Red',
            categoria: 'Mesa',
            cantidad: 5,
            precioVenta: 200
        });
        console.log('Producto Tienda created:', productoTienda._id);

        // 4. Register Purchase for Materia Prima
        const compraMP = await Compra.create({
            numCompra: 'COMP-TEST-MP-' + Date.now(),
            tipoCompra: 'Materia Prima',
            proveedor: proveedor._id,
            productos: [{
                producto: materiaPrima._id,
                onModel: 'MateriaPrima',
                cantidad: 5,
                precioUnitario: 100
            }],
            totalCompra: 500,
            metodosPago: [{ tipo: 'Efectivo', monto: 500 }]
        });
        console.log('Compra Materia Prima created:', compraMP._id);

        // 5. Register Purchase for Finished Product
        const compraPT = await Compra.create({
            numCompra: 'COMP-TEST-PT-' + Date.now(),
            tipoCompra: 'Producto Terminado',
            proveedor: proveedor._id,
            productos: [{
                producto: productoTienda._id,
                onModel: 'ProductoTienda',
                cantidad: 2,
                precioUnitario: 150
            }],
            totalCompra: 300,
            metodosPago: [{ tipo: 'Efectivo', monto: 300 }]
        });
        console.log('Compra Producto Terminado created:', compraPT._id);

        // 6. Verify Population
        const populatedMP = await Compra.findById(compraMP._id).populate('productos.producto');
        const populatedPT = await Compra.findById(compraPT._id).populate('productos.producto');

        if (populatedMP.productos[0].producto.nombre === materiaPrima.nombre) {
            console.log('SUCCESS: Materia Prima populated correctly');
        } else {
            console.error('FAILURE: Materia Prima NOT populated correctly');
        }

        if (populatedPT.productos[0].producto.nombre === productoTienda.nombre) {
            console.log('SUCCESS: Producto Terminado populated correctly');
        } else {
            console.error('FAILURE: Producto Terminado NOT populated correctly');
        }

        // Cleanup
        await Compra.deleteOne({ _id: compraMP._id });
        await Compra.deleteOne({ _id: compraPT._id });
        await MateriaPrima.deleteOne({ _id: materiaPrima._id });
        await ProductoTienda.deleteOne({ _id: productoTienda._id });
        await Proveedor.deleteOne({ _id: proveedor._id });

        console.log('Cleanup done');

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
