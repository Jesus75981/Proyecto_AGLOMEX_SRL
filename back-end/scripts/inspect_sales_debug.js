
import mongoose from 'mongoose';
import Venta from '../models/venta.model.js';
import ProductoTienda from '../models/productoTienda.model.js';

const mongoURI = 'mongodb://127.0.0.1:27017/proyecto_muebles';

const inspectSales = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('MongoDB Conectado');

        // Buscar ventas #1 y #2
        const ventas = await Venta.find({ numVenta: { $in: [1, 2, 3] } }).lean();

        console.log(`Encontradas ${ventas.length} ventas.`);

        ventas.forEach(v => {
            console.log(`\n--- Venta #${v.numVenta} (${v.fecha}) ---`);
            v.productos.forEach((p, i) => {
                console.log(`   Producto ${i + 1}: ${p.nombreProducto} (ID: ${p.producto})`);
                console.log(`   Costo Unitario: ${p.costoUnitario}`);
                console.log(`   Precio Unitario: ${p.precioUnitario}`);
            });
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

inspectSales();
