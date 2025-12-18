
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Conectado a MongoDB...');

        const testUsers = [
            { username: "dueno", password: "admin123", nombre: "Dueño", rol: "admin" },
            { username: "tienda", password: "admin123", nombre: "Vendedor", rol: "empleado_tienda" },
            { username: "stock", password: "admin123", nombre: "Almacenista", rol: "empleado_stock" }
        ];

        for (const u of testUsers) {
            const exists = await User.findOne({ username: u.username });
            if (!exists) {
                await new User(u).save();
                console.log(`✅ Usuario creado: ${u.username}`);
            } else {
                console.log(`ℹ️ Usuario ya existe: ${u.username}`);
            }
        }

        // List all users
        const allUsers = await User.find();
        console.log('--- Usuarios en BD ---');
        allUsers.forEach(u => console.log(`- ${u.username} (${u.rol})`));

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
