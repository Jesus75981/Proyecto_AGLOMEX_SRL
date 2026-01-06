
import mongoose from 'mongoose';
import Venta from '../models/venta.model.js';
import Compra from '../models/compra.model.js';
import ProductoTienda from '../models/productoTienda.model.js';

const mongoURI = 'mongodb://127.0.0.1:27017/mueblesDB';

const inspectHistory = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('MongoDB Conectado');

        // 1. Get Product ID from Venta #1
        const v1 = await Venta.findOne({ numVenta: 1 });
        if (!v1) {
            console.log("Venta #1 not found");
            return;
        }

        const prodId = v1.productos[0].producto;
        console.log(`Product ID from Venta #1: ${prodId}`);

        // 2. Find Purchases for this product
        const compras = await Compra.find({ "productos.producto": prodId }).sort({ fecha: 1 });

        console.log("\n--- HISTORIAL DE COMPRAS ---");
        compras.forEach(c => {
            const p = c.productos.find(item => item.producto.toString() === prodId.toString());
            console.log(`Fecha: ${c.fecha} | Compra #${c.numeroFactura || 'S/N'} | Costo: ${p.precioUnitario}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

inspectHistory();
