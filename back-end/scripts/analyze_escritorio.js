
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

async function analyze() {
    await mongoose.connect(MONGODB_URI);

    const escrit = await ProductoTienda.findOne({ nombre: /Escritorio/i });
    if (!escrit) {
        console.log('❌ "Escritorio" not found in Products!');
    } else {
        console.log(`✅ Found "Escritorio": ID=${escrit._id}, Stock=${escrit.cantidad}, Cost=${escrit.precioCompra}`);
    }

    const compras = await Compra.find();
    console.log(`Checking ${compras.length} purchases...`);

    compras.forEach(c => {
        c.productos.forEach(p => {
            // Check if this purchase item links to Escritorio
            if (escrit && p.producto && p.producto.toString() === escrit._id.toString()) {
                console.log(`✅ MATCH FOUND in Compra ${c.numCompra}: Qty=${p.cantidad}`);
            }

            // Check if it links to something else but looks like Escritorio? 
            // Without 'nombreProducto' stored in subdoc, we can't know easily unless we populate.
        });
    });

    // Let's populate to see what the purchase actually points to
    const comprasPop = await Compra.find().populate('productos.producto');
    comprasPop.forEach(c => {
        c.productos.forEach(p => {
            if (p.producto) {
                if (p.producto.nombre && p.producto.nombre.match(/Escritorio/i)) {
                    console.log(`ℹ️ Compra ${c.numCompra} points to Product "${p.producto.nombre}" (ID: ${p.producto._id})`);
                }
            } else {
                console.log(`⚠️ Compra ${c.numCompra} has item with MISSING PRODUCT REF (ID: ${p._id})`);
            }
        });
    });

    process.exit();
}

analyze();
