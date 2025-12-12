
import mongoose from 'mongoose';
import ProductoTienda from '../models/productoTienda.model.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mueblesDB';

async function migrateIndexes() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Drop existing indexes to remove potential single-field 'nombre' uniqueness
        try {
            await ProductoTienda.collection.dropIndex('nombre_1');
            console.log('Dropped index: nombre_1');
        } catch (e) {
            console.log('Index nombre_1 not found or already dropped.', e.message);
        }

        // 2. Create the new compound index defined in the schema
        await ProductoTienda.syncIndexes();
        console.log('Synced indexes (Created compound index on nombre + color)');

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateIndexes();
