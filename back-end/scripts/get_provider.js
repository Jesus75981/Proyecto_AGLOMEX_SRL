
import mongoose from 'mongoose';
import Proveedor from '../models/proveedores.model.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mueblesDB')
    .then(async () => {
        const p = await Proveedor.findOne();
        if (p) console.log('PROVEEDOR_ID:', p._id);
        else console.log('PROVEEDOR_ID: NONE');
        process.exit(0);
    })
    .catch(e => { console.error(e); process.exit(1); });
