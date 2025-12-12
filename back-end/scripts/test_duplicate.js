
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductoTienda from '../models/productoTienda.model.js';

dotenv.config();

const testDuplicate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mueblesDB');
        console.log('Connected to MongoDB');

        const name = "Test Duplicate Product " + Date.now();

        const p1 = new ProductoTienda({
            nombre: name,
            idProductoTienda: "TEST-ID-" + Date.now(),
            color: "Red",
            codigo: "TEST-RED",
            categoria: "Sillas",
            tipo: "Producto Terminado",
            dimensiones: { alto: 10, ancho: 10, profundidad: 10 },
            precioCompra: 100,
            precioVenta: 150,
            cantidad: 10
        });
        await p1.save();
        console.log('Created first product:', p1.nombre);

        const p2 = new ProductoTienda({
            nombre: name,
            idProductoTienda: "TEST-ID-2-" + Date.now(),
            color: "Blue",
            codigo: "TEST-BLUE",
            categoria: "Sillas",
            tipo: "Producto Terminado",
            dimensiones: { alto: 10, ancho: 10, profundidad: 10 },
            precioCompra: 100,
            precioVenta: 150,
            cantidad: 10
        });
        await p2.save();
        console.log('Created second product with SAME NAME:', p2.nombre);

        console.log('SUCCESS: Duplicates allowed.');

        // Cleanup
        await ProductoTienda.deleteMany({ nombre: name });
        console.log('Cleanup done.');

        process.exit(0);
    } catch (error) {
        console.error('FAILED:', error);
        process.exit(1);
    }
};

testDuplicate();
