import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductoTienda from '../models/productoTienda.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to DB');
        console.log('Listing all Productos...');

        const products = await ProductoTienda.find({});
        console.log('Total Products:', products.length);

        console.log('---------------------------------------------------');
        console.log('ID | Name | Category | Type | Stock');
        console.log('---------------------------------------------------');
        products.forEach(p => {
            console.log(`${p._id} | ${p.nombre} | ${p.categoria} | ${p.tipo} | ${p.cantidad}`);
        });
        console.log('---------------------------------------------------');

        mongoose.connection.close();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
