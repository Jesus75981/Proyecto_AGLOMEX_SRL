import mongoose from 'mongoose';
import User from '../models/user.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const listUsers = async () => {
    try {
        console.log('Connecting to:', MONGODB_URI.replace(/:([^@]+)@/, ':****@'));
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected.');

        const users = await User.find({}, 'username rol');
        console.log('--- USERS IN DB ---');
        console.table(users.map(u => ({ id: u._id, username: u.username, rol: u.rol })));

        if (users.length === 0) {
            console.log('⚠️ NO USERS FOUND! Database is empty.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

listUsers();
