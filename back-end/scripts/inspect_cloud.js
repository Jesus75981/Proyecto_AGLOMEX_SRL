import mongoose from 'mongoose';

const CLOUD_URI = 'mongodb+srv://ronaldtumiri66_db_user:u2u9uVCIGnCcFNVG@cluster0.ekaqwz7.mongodb.net/proyecto_muebles?retryWrites=true&w=majority';

const run = async () => {
    try {
        console.log('Connecting to Cloud:', CLOUD_URI.split('@')[1]); // Log safe part
        await mongoose.connect(CLOUD_URI);

        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const { databases } = await admin.listDatabases();

        console.log('\n--- CLOUD DATABASES ---');
        for (const dbInfo of databases) {
            console.log(`- ${dbInfo.name} (${dbInfo.sizeOnDisk})`);
        }

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n--- COLLECTIONS IN CURRENT DB ---');
        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} docs`);
        }

    } catch (error) {
        console.error('FAIL:', error.message);
    } finally {
        await mongoose.disconnect();
    }
};

run();
