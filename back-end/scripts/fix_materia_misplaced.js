
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import MateriaPrima from '../models/materiaPrima.model.js';
import ProductoTienda from '../models/productoTienda.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

async function checkAndFix() {
    await mongoose.connect(MONGODB_URI);

    console.log('--- Checking MateriaPrima ---');
    const mats = await MateriaPrima.find({ nombre: /Escritorio/i });
    if (mats.length > 0) {
        console.log(`⚠️ Found ${mats.length} "Escritorio" in MateriaPrima!`);
        mats.forEach(m => console.log(`   ID: ${m._id}, Name: ${m.nombre}, Stock: ${m.cantidad}`));

        // Fix: Delete them from MateriaPrima
        console.log('🗑️ Deleting WRONG "Escritorio" from MateriaPrima...');
        await MateriaPrima.deleteMany({ nombre: /Escritorio/i });
        console.log('✅ Deleted.');
    } else {
        console.log('✅ No "Escritorio" found in MateriaPrima.');
    }

    console.log('--- Checking ProductoTienda ---');
    const prods = await ProductoTienda.find({ nombre: /Escritorio/i });
    if (prods.length > 0) {
        console.log(`Found ${prods.length} "Escritorio" in ProductoTienda (Correct):`);
        prods.forEach(p => console.log(`   ID: ${p._id}, Name: ${p.nombre}, Stock: ${p.cantidad}`));
    } else {
        console.log('⚠️ Warning: "Escritorio" MISSING from ProductoTienda!');
    }

    process.exit();
}

checkAndFix();
