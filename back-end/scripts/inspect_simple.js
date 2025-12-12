
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import ProductoTienda from '../models/productoTienda.model.js';
import Compra from '../models/compra.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

async function inspectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected.');

        const productos = await ProductoTienda.find();
        console.log(`\n📦 Total Products: ${productos.length}`);
        productos.forEach(p => {
            console.log(`[${p._id}] "${p.nombre}" | Col: ${p.color} | Stk: ${p.cantidad} | Cost: ${p.precioCompra}`);
        });

        const compras = await Compra.find();
        console.log(`\n🛒 Total Purchases: ${compras.length}`);
        compras.forEach(c => {
            console.log(`[${c._id}] #${c.numCompra} | Status: ${c.estado}`);
            c.productos.forEach(p => {
                console.log(`   - RefID: ${p.producto} | Name: ${p.nombreProducto} | Qty: ${p.cantidad}`);
            });
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

inspectDB();
