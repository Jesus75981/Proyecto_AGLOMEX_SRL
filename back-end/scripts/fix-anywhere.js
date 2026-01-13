
import mongoose from 'mongoose';

const dbs = [
    'mongodb://127.0.0.1:27017/proyecto_muebles',
    'mongodb://127.0.0.1:27017/muebles_db',
    'mongodb://127.0.0.1:27017/aglo-sistemas',
    'mongodb://127.0.0.1:27017/mueblesDB',
    'mongodb://127.0.0.1:27017/proyecto-muebles'
];

const fixInDB = async (uri) => {
    try {
        const conn = await mongoose.createConnection(uri).asPromise();
        // console.log(`Checking ${uri}...`); // Reduce noise

        const collections = await conn.db.listCollections().toArray();
        const productColl = collections.find(c => c.name.toLowerCase().includes('producto')); // Matches productos, productotiendas, etc.

        if (productColl) {
            const collection = conn.collection(productColl.name);

            // Fix ESC-0003
            const p1 = await collection.findOne({ codigo: 'ESC-0003' });
            if (p1) {
                console.log(`[${uri}] FOUND ESC-0003. Current Cat: ${p1.categoria}`);
                await collection.updateOne(
                    { codigo: 'ESC-0003' },
                    { $set: { categoria: 'Escritorio' } }
                );
                console.log(`[${uri}] UPDATED ESC-0003 to 'Escritorio'`);
            }

            // Fix ESC-0004
            const p2 = await collection.findOne({ codigo: 'ESC-0004' });
            if (p2) {
                console.log(`[${uri}] FOUND ESC-0004. Current Cat: ${p2.categoria}`);
                await collection.updateOne(
                    { codigo: 'ESC-0004' },
                    { $set: { categoria: 'Escritorio' } }
                );
                console.log(`[${uri}] UPDATED ESC-0004 to 'Escritorio'`);
            }
        }
        await conn.close();
    } catch (err) {
        // console.log(`Failed ${uri}`);
    }
};

const run = async () => {
    console.log("Starting Universal Fix...");
    for (const uri of dbs) {
        await fixInDB(uri);
    }
    console.log("Universal Fix Complete.");
};

run();
