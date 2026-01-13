
import mongoose from 'mongoose';

// Determined DB from previous step (likely proyecto-muebles with hyphen based on output)
const mongoURI = 'mongodb://127.0.0.1:27017/proyecto-muebles';

const fixTypos = async () => {
    try {
        const conn = await mongoose.createConnection(mongoURI).asPromise();
        console.log(`Connected to ${mongoURI}`);

        const collections = await conn.db.listCollections().toArray();
        const productColl = collections.find(c => c.name.toLowerCase().includes('producto'));

        if (!productColl) {
            console.log("No product collection found!");
            return;
        }

        console.log(`Using collection: ${productColl.name}`);
        const collection = conn.collection(productColl.name);

        // Fix ESC-0003
        const result1 = await collection.updateOne(
            { codigo: 'ESC-0003', categoria: 'ESCRRITORIO' },
            { $set: { categoria: 'Escritorio' } }
        );
        console.log(`ESC-0003 Fix: Matched ${result1.matchedCount}, Modified ${result1.modifiedCount}`);

        // Fix ESC-0004
        const result2 = await collection.updateOne(
            { codigo: 'ESC-0004', categoria: 'Mesa' },
            { $set: { categoria: 'Escritorio' } }
        );
        console.log(`ESC-0004 Fix: Matched ${result2.matchedCount}, Modified ${result2.modifiedCount}`);

        await conn.close();
        console.log('Update process complete.');

    } catch (error) {
        console.error('Error:', error);
    }
};

fixTypos();
