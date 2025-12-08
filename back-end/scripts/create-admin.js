import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config();

const mongoURI = 'mongodb://127.0.0.1:27017/mueblesDB'; // Asegurando que coincida con server_new.js

const createAdmin = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('✅ Conectado a MongoDB');

        // Verificar si ya existe
        const existingUser = await User.findOne({ username: 'dueno' });
        if (existingUser) {
            console.log('⚠️ El usuario "dueno" ya existe.');

            // Opcional: Actualizar contraseña si es necesario, o borrar y recrear
            // await User.deleteOne({ username: 'dueno' });
        } else {
            const adminUser = new User({
                username: 'dueno',
                password: 'admin123',
                rol: 'admin',
                nombre: 'Dueño',
                email: 'dueno@aglomex.com'
            });

            await adminUser.save();
            console.log('✅ Usuario "dueno" creado exitosamente.');
        }

    } catch (error) {
        console.error('❌ Error creando usuario:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Conexión cerrada');
        process.exit(0);
    }
};

createAdmin();
