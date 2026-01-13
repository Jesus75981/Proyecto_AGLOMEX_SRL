
import mongoose from 'mongoose';

const mongoURI = 'mongodb://127.0.0.1:27017/proyecto-muebles';

const fixTyposForce = async () => {
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

        // Force Fix ESC-0003
        const p1 = await collection.findOne({ codigo: 'ESC-0003' });
        if (p1) {
            console.log('Found ESC-0003:', JSON.stringify(p1, null, 2));
            await collection.updateOne(
                { codigo: 'ESC-0003' },
                { $set: { categoria: 'Escritorio' } }
            );
            console.log('Forced update ESC-0003 category to "Escritorio"');
        } else {
            console.log('ESC-0003 NOT FOUND');
        }

        // Force Fix ESC-0004
        const p2 = await collection.findOne({ codigo: 'ESC-0004' });
        if (p2) {
            console.log('Found ESC-0004:', JSON.stringify(p2, null, 2));
            await collection.updateOne(
                { codigo: 'ESC-0004' },
                { $set: { categoria: 'Escritorio' } }
            );
            console.log('Forced update ESC-0004 category to "Escritorio"');
        } else {
            console.log('ESC-0004 NOT FOUND');
        }

        await conn.close();
        console.log('Done.');

    } catch (error) {
        console.error('Error:', error);
    }
};

fixTyposForce();
