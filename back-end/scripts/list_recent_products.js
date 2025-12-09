import mongoose from 'mongoose';
import ProductoTienda from '../models/productoTienda.model.js';
import Objeto3D from '../models/objetos3d.model.js';
import fs from 'fs';

const MONGO_URI = 'mongodb://localhost:27017/mueblesDB';

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const products = await ProductoTienda.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('objeto3D');

        let output = '\n--- Recent Products ---\n';
        if (products.length === 0) {
            output += "No products found.\n";
        }
        products.forEach(p => {
            output += `ID: ${p._id}\n`;
            output += `Name: ${p.nombre}\n`;
            output += `Image: ${p.imagen}\n`;
            output += `3D Model: ${p.objeto3D ? (p.objeto3D.glbUrl ? 'YES (' + p.objeto3D.status + ')' : 'NO (' + (p.objeto3D.status || 'N/A') + ')') : 'NONE'}\n`;
            output += '-----------------------\n';
        });

        fs.writeFileSync('products_list.txt', output);
        console.log('Output written to products_list.txt');

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.connection.close();
    }
};

run();
