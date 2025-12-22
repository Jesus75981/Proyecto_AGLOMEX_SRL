import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductoTienda from '../models/productoTienda.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to DB for Verification');

        const patterns = [/Madera/i, /Madero/i, /Tornillo/i, /Manija/i];
        const categories = [/TORNILLOS/i, /MADERAS/i, /MANIJAS/i];

        const query = {
            $or: [
                ...patterns.map(p => ({ nombre: { $regex: p } })),
                ...categories.map(c => ({ categoria: { $regex: c } }))
            ]
        };

        const count = await ProductoTienda.countDocuments(query);
        const items = await ProductoTienda.find(query);

        if (count === 0) {
            console.log('✅ CLEANUP VERIFIED: No raw materials found in Products.');
        } else {
            console.log(`❌ WARNING: Found ${count} raw material items remaining:`);
            items.forEach(i => console.log(`   - ${i.nombre} (${i.categoria})`));
        }

        mongoose.connection.close();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
