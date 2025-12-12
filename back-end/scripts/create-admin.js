
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mueblesDB';

const createAdmin = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // Verificar si ya existe
        const existingAdmin = await User.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('⚠️ El usuario admin ya existe.');
            return;
        }

        // Crear nuevo admin
        const adminUser = new User({
            username: 'admin',
            password: 'admin123', // El hook pre-save lo hasheará
            nombre: 'Administrador Default',
            rol: 'admin'
        });

        await adminUser.save();
        console.log('🎉 Usuario admin creado exitosamente.');
        console.log('User: admin');
        console.log('Pass: admin123');

    } catch (error) {
        console.error('❌ Error creando admin:', error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

createAdmin();
