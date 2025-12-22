import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductoTienda from '../models/productoTienda.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to DB for Product Cleanup');

        // Define patterns for "Raw Materials" that shouldn't be in Finished Products
        const patterns = [/Madera/i, /Madero/i, /Tornillo/i, /Manija/i];
        const categories = [/TORNILLOS/i, /MADERAS/i, /MANIJAS/i];

        const query = {
            $or: [
                ...patterns.map(p => ({ nombre: { $regex: p } })),
                ...categories.map(c => ({ categoria: { $regex: c } }))
            ]
        };

        const candidates = await ProductoTienda.find(query);

        if (candidates.length === 0) {
            console.log('No matching "Raw Material" items found in Products.');
        } else {
            console.log(`Found ${candidates.length} items to delete:`);
            candidates.forEach(c => console.log(`- ${c.nombre} (${c.categoria})`));

            const result = await ProductoTienda.deleteMany(query);
            console.log(`\n🗑️ Deleted ${result.deletedCount} items successfully.`);
        }

        mongoose.connection.close();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
