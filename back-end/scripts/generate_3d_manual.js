import mongoose from 'mongoose';
import ProductoTienda from '../models/productoTienda.model.js';
import Objeto3D from '../models/objetos3d.model.js';
import * as tripoService from '../services/tripo.service.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = 'mongodb://localhost:27017/mueblesDB';
const PRODUCT_ID = '6931947e111761f9f9c0403d'; // ID for 'asd'

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const producto = await ProductoTienda.findById(PRODUCT_ID);
        if (!producto) {
            console.error('Product not found');
            return;
        }

        console.log(`Found product: ${producto.nombre}`);
        if (!producto.imagen) {
            console.error('Product has no image');
            return;
        }

        console.log(`Image URL: ${producto.imagen}`);
        console.log('Triggering Tripo AI...');

        const taskId = await tripoService.create3DTask(producto.imagen);
        console.log(`Task created: ${taskId}`);

        const nuevoObjeto3D = new Objeto3D({
            producto: producto._id,
            sourceImage: producto.imagen,
            tripoTaskId: taskId,
            status: 'queued'
        });
        await nuevoObjeto3D.save();

        producto.objeto3D = nuevoObjeto3D._id;
        await producto.save();

        console.log('Objeto3D created and linked to product.');

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.connection.close();
    }
};

run();
