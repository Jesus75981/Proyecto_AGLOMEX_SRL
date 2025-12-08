import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config();

const mongoURI = 'mongodb://127.0.0.1:27017/mueblesDB'; // Asegurando que coincida con server_new.js

const createUsers = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log('✅ Conectado a MongoDB');

        const usersToCreate = [
            {
                username: 'dueno',
                password: 'admin123',
                rol: 'admin',
                nombre: 'Dueño',
                email: 'dueno@aglomex.com'
            },
            {
                username: 'vendedor',
                password: 'vendedor123',
                rol: 'empleado_tienda',
                nombre: 'Vendedor de Tienda',
                email: 'vendedor@aglomex.com'
            }
        ];

        for (const userData of usersToCreate) {
            const existingUser = await User.findOne({ username: userData.username });
            if (existingUser) {
                console.log(`⚠️ El usuario "${userData.username}" ya existe.`);
            } else {
                const newUser = new User(userData);
                await newUser.save();
                console.log(`✅ Usuario "${userData.username}" creado exitosamente.`);
            }
        }

    } catch (error) {
        console.error('❌ Error creando usuarios:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Conexión cerrada');
        process.exit(0);
    }
};

createUsers();
