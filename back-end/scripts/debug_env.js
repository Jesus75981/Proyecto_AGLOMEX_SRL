import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly point to .env
const envPath = path.join(__dirname, '..', '.env');
dotenv.config({ path: envPath });

console.log('--- DEBUG INFO ---');
console.log('Env Path:', envPath);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('JWT_SECRET Length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'MISSING');

const run = async () => {
    try {
        console.log('Attempting DB Connection...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ DB Connection Successful');

        const user = await User.findOne({ username: 'jesus' });
        if (user) {
            console.log('✅ User "jesus" found:', user.rol);
        } else {
            console.log('❌ User "jesus" NOT found');
        }

    } catch (error) {
        console.error('❌ DB Connection Failed:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

run();
