import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Objeto3D from '../models/objetos3d.model.js';
import ProductoTienda from '../models/productoTienda.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mueblesDB';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('--- INSPECTING 3D OBJECTS FOR "asd" ---');

        // Find object for product "asd"
        const objects = await Objeto3D.find().populate({
            path: 'producto',
            match: { nombre: 'asd' }
        });

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
