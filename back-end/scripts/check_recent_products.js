import mongoose from 'mongoose';
import ProductoTienda from '../models/productoTienda.model.js';
import Objeto3D from '../models/objetos3d.model.js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = 'mongodb://localhost:27017/mueblesDB';

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI);

        const products = await ProductoTienda.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('objeto3D');

        const result = products.map(p => ({
            id: p._id,
            name: p.nombre,
            image: p.imagen,
            createdAt: p.createdAt,
            objeto3D: p.objeto3D ? {
                id: p.objeto3D._id,
                status: p.objeto3D.status,
                tripoTaskId: p.objeto3D.tripoTaskId,
                glbUrl: p.objeto3D.glbUrl,
                error: p.objeto3D.error
            } : "NONE"
        }));

        fs.writeFileSync('recent_products_status.json', JSON.stringify(result, null, 2));
        console.log('Status written to recent_products_status.json');

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.connection.close();
    }
};

run();
