
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mueblesDB';

async function checkDbWrite() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB.');

        const testCollection = mongoose.connection.collection('system_checks');
        await testCollection.insertOne({ check: 'persistence', date: new Date() });

        console.log('Write check PASSED: Data written to DB successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Write check FAILED:', error.message);
        if (error.codeName === 'OutOfDiskSpace') {
            console.error('CRITICAL: Database is out of disk space!');
        }
        process.exit(1);
    }
}

checkDbWrite();
