import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MateriaPrima from '../models/materiaPrima.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to DB');
        console.log('Listing all Materia Prima...');

        const materials = await MateriaPrima.find({});
        console.log('Total Materials:', materials.length);

        console.log('---------------------------------------------------');
        console.log('ID | Name | Category | Stock | Cost');
        console.log('---------------------------------------------------');
        materials.forEach(m => {
            console.log(`${m._id} | ${m.nombre} | ${m.categoria} | ${m.cantidad} | ${m.precioCompra}`);
        });
        console.log('---------------------------------------------------');

        mongoose.connection.close();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
