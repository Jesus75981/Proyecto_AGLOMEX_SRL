import mongoose from 'mongoose';
import Produccion from '../models/produccion.model.js';
import ProductoTienda from '../models/productoTienda.model.js';
import Logistica from '../models/logistica.model.js';

const MONGODB_URI = 'mongodb://localhost:27017/mueblesDB';

async function debugProduccion() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        console.log("--- Checking Completed Productions ---");
        const productions = await Produccion.find({ estado: 'Completado' }).sort({ createdAt: -1 }).limit(5);
        console.log(`Found ${productions.length} completed productions.`);
        productions.forEach(p => {
            console.log(`- Order: ${p.numeroOrden}, Name: "${p.nombre}", FinalProduct: ${p.productoFinal}`);
        });

        console.log("\n--- Checking Products in Store (ProductoTienda) ---");
        // Search strictly for "silla" and loosely (regex)
        const exactSilla = await ProductoTienda.findOne({ nombre: 'silla' });
        console.log(`Exact "silla" found: ${!!exactSilla}`, exactSilla ? `(ID: ${exactSilla._id}, Qty: ${exactSilla.cantidad})` : '');

        const regexSilla = await ProductoTienda.find({ nombre: /silla/i });
        console.log(`Regex /silla/i found ${regexSilla.length} items:`);
        regexSilla.forEach(p => console.log(`- "${p.nombre}" (ID: ${p._id}, Qty: ${p.cantidad})`));

        console.log("\n--- Checking Logistics (Logistica) ---");
        const logistics = await Logistica.find().sort({ createdAt: -1 }).limit(5);
        logistics.forEach(l => {
            console.log(`- Logistics Type: ${l.tipoMovimiento}, Products: ${l.productos.length}`);
        });

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

debugProduccion();
