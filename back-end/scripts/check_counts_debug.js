
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

async function checkCounts() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log(`Connected to ${MONGODB_URI}`);

        const collections = await mongoose.connection.db.collections();

        console.log('\n--- Collection Counts ---');
        for (const collection of collections) {
            const count = await collection.countDocuments();
            console.log(`${collection.collectionName}: ${count}`);
        }
        console.log('-------------------------\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkCounts();
