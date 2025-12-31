
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const wipeData = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        const collections = await mongoose.connection.db.collections();

        for (const collection of collections) {
            const name = collection.collectionName;

            // PROTECT USERS COLLECTION
            if (name === 'users') {
                console.log(`Skipping collection: ${name} (Protected)`);
                continue;
            }

            // Optional: Skip system collections
            if (name.startsWith('system.')) {
                continue;
            }

            try {
                // Delete all documents
                const result = await collection.deleteMany({});
                console.log(`Cleared collection: ${name} (${result.deletedCount} documents deleted)`);

                // Optional: Reset indexes if needed, but usually not required for simple data wipe
            } catch (err) {
                console.error(`Error clearing collection ${name}:`, err.message);
            }
        }

        console.log('Database wipe completed successfully (Users preserved).');
        process.exit(0);

    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
};

wipeData();
