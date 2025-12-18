
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017'; // Admin access usually

const listDbs = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI);
        const admin = new mongoose.mongo.Admin(conn.connection.db);
        const result = await admin.listDatabases();
        console.log('--- DATABASES ---');
        result.databases.forEach(db => console.log(`- ${db.name} (size: ${db.sizeOnDisk})`));
        console.log('-----------------');
        process.exit(0);
    } catch (error) {
        console.error('Error listing DBs:', error);
        process.exit(1);
    }
};

listDbs();
