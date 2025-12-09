import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config();

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

const ensureAdmin = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('✅ Conectado a MongoDB');

        const existingUser = await User.findOne({ username: 'admin' });
        if (existingUser) {
            console.log('⚠️ El usuario "admin" ya existe.');
            // Update password just in case
            existingUser.password = 'admin123';
            await existingUser.save();
            console.log('🔄 Contraseña de "admin" actualizada a "admin123".');
        } else {
            const adminUser = new User({
                username: 'admin',
                password: 'admin123',
                rol: 'admin',
                nombre: 'Administrador',
                email: 'admin@aglomex.com' // Dummy email
            });

            await adminUser.save();
            console.log('✅ Usuario "admin" creado exitosamente.');
        }

    } catch (error) {
        console.error('❌ Error creando usuario:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Conexión cerrada');
        process.exit(0);
    }
};

ensureAdmin();
