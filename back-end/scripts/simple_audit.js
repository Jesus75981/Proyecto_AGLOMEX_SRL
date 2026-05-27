import mongoose from 'mongoose';

const uri = 'mongodb://localhost:27017';

const run = async () => {
    try {
        await mongoose.connect(uri);
        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const result = await admin.listDatabases();

        console.log('--- DBs ---');
        result.databases.forEach(db => {
            console.log(`- ${db.name} (${db.sizeOnDisk})`);
        });

    } catch (error) {
        console.error('FAIL:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

run();
