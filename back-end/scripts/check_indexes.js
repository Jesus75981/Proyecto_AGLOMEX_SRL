
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductoTienda from '../models/productoTienda.model.js';

dotenv.config();

const checkIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mueblesDB');
        console.log('Connected to MongoDB');

        const indexes = await ProductoTienda.collection.getIndexes();
        console.log('Indexes:', indexes);

        process.exit(0);
    } catch (error) {
        console.error('Error checking indexes:', error);
        process.exit(1);
    }
};

checkIndexes();
