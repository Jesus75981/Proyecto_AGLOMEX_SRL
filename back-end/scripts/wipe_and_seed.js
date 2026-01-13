import mongoose from 'mongoose';
import User from '../models/user.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const seed = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB.');

        // 1. DELETE ALL USERS
        await User.deleteMany({});
        console.log('🗑️ Deleted all existing users.');

        // 2. CREATE USERS
        const users = [
            { username: 'admin', password: 'admin123', nombre: 'Admin', rol: 'admin' },
            { username: 'dueno', password: 'admin123', nombre: 'Dueño', rol: 'admin' },
            { username: 'tienda', password: 'tienda123', nombre: 'Tienda', rol: 'empleado_tienda' }
        ];

        for (const u of users) {
            const newUser = new User(u);
            await newUser.save();
            console.log(`✅ Created user: ${u.username} / ${u.password}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

seed();
