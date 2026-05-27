import mongoose from 'mongoose';

const uri = 'mongodb://localhost:27017';

const run = async () => {
    try {
        const conn = await mongoose.connect(uri);
        const admin = conn.connection.db.admin();

        // 1. List Databases
        const { databases } = await admin.listDatabases();
        console.log('--- BASES DE DATOS ENCONTRADAS ---');

        for (const dbInfo of databases) {
            if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;

            console.log(`\n📂 BASE DE DATOS: ${dbInfo.name}`);
            console.log(`   (Tamaño: ${dbInfo.sizeOnDisk} bytes)`);

            // Switch to this DB
            const db = conn.connection.useDb(dbInfo.name);
            const collections = await db.listCollections().toArray();

            // Check for specific collections
            for (const col of collections) {
                if (['bankaccounts', 'finanzas', 'ventas', 'productos'].includes(col.name)) {
                    const count = await db.collection(col.name).countDocuments();
                    console.log(`   - Colección: ${col.name} (${count} documentos)`);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
