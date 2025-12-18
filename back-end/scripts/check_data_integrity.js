
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MateriaPrima from '../models/materiaPrima.model.js';
import Produccion from '../models/produccion.model.js';
import User from '../models/user.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

async function checkData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        const materialsCount = await MateriaPrima.countDocuments();
        const produccionCount = await Produccion.countDocuments();
        const usersCount = await User.countDocuments();

        console.log(`📊 Resumen de Datos:`);
        console.log(`- Materiales: ${materialsCount}`);
        console.log(`- Órdenes de Producción: ${produccionCount}`);
        console.log(`- Usuarios: ${usersCount}`);

        // Listar usuarios para ver si son los viejos o los nuevos
        const users = await User.find({}, 'username rol');
        console.log('- Lista de Usuarios:', users.map(u => `${u.username} (${u.rol})`).join(', '));

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkData();
