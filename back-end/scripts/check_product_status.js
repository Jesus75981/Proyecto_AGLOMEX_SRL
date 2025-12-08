import mongoose from 'mongoose';
import ProductoTienda from '../models/productoTienda.model.js';
import Objeto3D from '../models/objetos3d.model.js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = 'mongodb://localhost:27017/mueblesDB';
const PRODUCT_ID = '6931947e111761f9f9c0403d'; // ID for 'asd'

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI);

        const producto = await ProductoTienda.findById(PRODUCT_ID).populate('objeto3D');

        const result = {
            product: producto ? {
                id: producto._id,
                name: producto.nombre,
                objeto3D: producto.objeto3D
            } : null
        };

        fs.writeFileSync('product_status.json', JSON.stringify(result, null, 2));
        console.log('Status written to product_status.json');

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.connection.close();
    }
};

run();
