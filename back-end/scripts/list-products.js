
import mongoose from 'mongoose';
import ProductoTienda from '../models/productoTienda.model.js';

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/muebles_db');
        console.log('Connected to MongoDB');

        const products = await ProductoTienda.find({});
        console.log(`Found ${products.length} products.`);

        products.forEach(p => {
            console.log(`ID: ${p._id}, Name: "${p.nombre}", Code: "${p.codigo}", idProd: "${p.idProductoTienda}"`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

run();
