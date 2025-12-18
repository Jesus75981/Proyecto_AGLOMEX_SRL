
import mongoose from 'mongoose';
import ProductoTienda from '../models/productoTienda.model.js';
import Objeto3D from '../models/objetos3d.model.js'; // Ensure model is registered
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/mueblesDB';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        try {
            const productos = await ProductoTienda.find({ activo: true }).populate('objeto3D');
            console.log(`Found ${productos.length} active products.`);

            const with3D = productos.filter(p => p.objeto3D);
            console.log(`Products with objeto3D: ${with3D.length}`);

            with3D.forEach(p => {
                console.log(`Product: ${p.nombre}, GLB: ${p.objeto3D.glbUrl}`);
            });

            if (with3D.length === 0) {
                console.log("No products have linked 3D objects.");
            }

        } catch (err) {
            console.error(err);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => console.error(err));
