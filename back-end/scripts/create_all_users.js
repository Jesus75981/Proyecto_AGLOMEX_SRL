
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

const usersToCreate = [
    { username: 'admin', password: 'admin123', nombre: 'Administrador Default', rol: 'admin' },
    { username: 'dueno', password: 'admin123', nombre: 'Dueño', rol: 'admin' },
    { username: 'tienda', password: 'admin123', nombre: 'Empleado Tienda', rol: 'empleado_tienda' },
    { username: 'stock', password: 'admin123', nombre: 'Empleado Stock', rol: 'empleado_stock' }
];

const createUsers = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log(`✅ Connected to MongoDB at ${MONGODB_URI}`);

        for (const userData of usersToCreate) {
            const existing = await User.findOne({ username: userData.username });
            if (existing) {
                console.log(`⚠️ User '${userData.username}' already exists. Skipping.`);
            } else {
                const user = new User(userData);
                await user.save();
                console.log(`✅ Created user: ${userData.username} (${userData.rol})`);
            }
        }

        console.log('\n🎉 All users processed successfully.');

    } catch (error) {
        console.error('❌ Error creating users:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
};

createUsers();
