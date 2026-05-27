import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/productoTienda.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const MONGODB_URI = process.env.MONGODB_URI;

const run = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB.');

        // Delete products with "IA" or "Generada" in name
        const result = await Product.deleteMany({
            $or: [
                { nombre: /Generada por IA/i },
                { descripcion: /creada autom/i }
            ]
        });

        console.log(`🗑️ Eliminados ${result.deletedCount} productos generados por IA.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
