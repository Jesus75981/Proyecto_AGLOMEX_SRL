import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

console.log('--- DB Connection Test ---');
if (!uri) {
    console.error('ERROR: No MONGODB_URI or MONGO_URI found in .env');
    process.exit(1);
}

// Mask password for display
const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
console.log(`Attempting to connect to: ${maskedUri}`);

try {
    await mongoose.connect(uri);
    console.log('✅ Connection SUCCESSFUL!');
    console.log('Database name:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);

    await mongoose.disconnect();
    console.log('Disconnected.');
    process.exit(0);
} catch (error) {
    console.error('❌ Connection FAILED');
    console.error('Error details:', error.message);
    process.exit(1);
}
