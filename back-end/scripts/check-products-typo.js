
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductoTienda from '../models/productoTienda.model.js';

dotenv.config();

const connectDB = async () => {
    try {
        const mongoURI = 'mongodb://127.0.0.1:27017/muebles_db';
        console.log('Connecting to:', mongoURI);
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

const checkProducts = async () => {
    await connectDB();
    try {
        const products = await ProductoTienda.find({ codigo: { $in: ['ESC-0003', 'ESC-0004'] } });
        console.log(JSON.stringify(products, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

checkProducts();
