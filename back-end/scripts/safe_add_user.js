import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const MONGODB_URI = process.env.MONGODB_URI;

const run = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a:', MONGODB_URI);

        const username = 'jesus';
        const exists = await User.findOne({ username });

        if (!exists) {
            console.log('User "jesus" not found. Creating...');
            const newUser = new User({
                username: 'jesus',
                password: 'jesus123',
                nombre: 'Jesus',
                rol: 'admin'
            });
            await newUser.save();
            console.log('✅ Usuario "jesus" CREADO exitosamente.');
        } else {
            console.log('ℹ️ El usuario "jesus" YA EXISTE. No se hicieron cambios.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
