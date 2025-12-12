
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars if needed, but we will force the correct URI found in logging
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

async function wipeDB() {
    try {
        console.log(`Connecting to ${MONGODB_URI}...`);
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected.');

        console.log('🗑️ Dropping database...');
        await mongoose.connection.db.dropDatabase();
        console.log('✅ Database dropped successfully.');

        // Final verification
        const collections = await mongoose.connection.db.collections();
        if (collections.length === 0) {
            console.log('✨ Verification: 0 collections found. Database is empty.');
        } else {
            console.log(`⚠️ Verification: ${collections.length} collections still exist (might be system collections).`);
        }

    } catch (error) {
        console.error('❌ Error wiping database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

wipeDB();
