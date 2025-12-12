
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductoTienda from '../models/productoTienda.model.js';

dotenv.config();

const dropLengthIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mueblesDB');
        console.log('Connected to MongoDB');

        // Drop the index
        try {
            await ProductoTienda.collection.dropIndex('nombre_1');
            console.log('Dropped index: nombre_1');
        } catch (e) {
            console.log('Index nombre_1 might not exist or verify name:', e.message);
        }

        // Verify
        const indexes = await ProductoTienda.collection.getIndexes();
        console.log('Remaining Indexes:', indexes);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

dropLengthIndex();
