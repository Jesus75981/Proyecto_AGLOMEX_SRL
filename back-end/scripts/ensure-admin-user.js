import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config();

const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

const ensureAdmin = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('✅ Conectado a MongoDB');

        // Delete existing admin to ensure clean state
        // await User.deleteOne({ username: 'admin' });
        // console.log('🗑️ Usuario "admin" eliminado (limpieza).');

        const adminUser = new User({
            username: 'admin',
            password: 'admin123',
            rol: 'admin',
            nombre: 'Administrador',
            email: 'admin@aglomex.com'
        });

        await adminUser.save();
        console.log('✅ Usuario "admin" creado exitosamente.');

    } catch (error) {
        console.error('❌ Error gestionando usuario:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Conexión cerrada');
        process.exit(0);
    }
};

ensureAdmin();
