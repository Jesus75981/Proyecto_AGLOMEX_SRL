import mongoose from 'mongoose';

async function check() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect('mongodb://localhost:27017/admin');
        const admin = mongoose.connection.db.admin();
        const result = await admin.listDatabases();

        console.log("\n--- DATABASE REPORT ---");
        for (const dbInfo of result.databases) {
            if (['admin', 'config', 'local'].includes(dbInfo.name)) continue;
            console.log(`\n[Database: ${dbInfo.name}]`);
            // Switch context to this DB
            const dbConn = mongoose.connection.useDb(dbInfo.name);
            // List collections
            const collections = await dbConn.db.listCollections().toArray();
            if (collections.length === 0) {
                console.log("  (No collections)");
            }
            for (const col of collections) {
                const count = await dbConn.db.collection(col.name).countDocuments();
                if (count > 0) {
                    console.log(`  - ${col.name}: ${count} documents`);
                } else {
                    console.log(`  - ${col.name}: 0 documents`);
                }
            }
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        console.log("\nClosing connection.");
        await mongoose.disconnect();
    }
}
check();
