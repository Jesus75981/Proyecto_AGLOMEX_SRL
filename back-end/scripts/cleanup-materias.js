import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MateriaPrima from '../models/materiaPrima.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to DB for Cleanup');

        // Define patterns for "Finished Products" that shouldn't be in Materia Prima
        // User specifically asked to delete "Producto Terminado"
        const patterns = [/Silla/i, /Sillon/i, /Sillón/i, /Escritorio/i, /Gamer/i, /Mesas/i];

        const query = {
            $or: patterns.map(p => ({ nombre: { $regex: p } }))
        };

        const candidates = await MateriaPrima.find(query);

        if (candidates.length === 0) {
            console.log('No matching "Finished Product" items found in Materia Prima.');
        } else {
            console.log(`Found ${candidates.length} items to delete:`);
            candidates.forEach(c => console.log(`- ${c.nombre} (${c.categoria})`));

            const result = await MateriaPrima.deleteMany(query);
            console.log(`\n🗑️ Deleted ${result.deletedCount} items successfully.`);
        }

        mongoose.connection.close();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
