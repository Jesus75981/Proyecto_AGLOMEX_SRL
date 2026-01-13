
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductoTienda from '../models/productoTienda.model.js';

dotenv.config();

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/proyecto_muebles';
        console.log('Connecting to:', mongoURI);
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

const listAllProducts = async () => {
    await connectDB();
    try {
        const products = await ProductoTienda.find({});
        console.log(`Total products: ${products.length}`);
        products.forEach(p => console.log(`${p.codigo} - ${p.nombre} - ${p.categoria}`));
    } catch (error) {
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
};

listAllProducts();
