
import mongoose from 'mongoose';

const dbs = [
    'mongodb://127.0.0.1:27017/proyecto_muebles',
    'mongodb://127.0.0.1:27017/muebles_db',
    'mongodb://127.0.0.1:27017/aglo-sistemas',
    'mongodb://127.0.0.1:27017/mueblesDB',
    'mongodb://127.0.0.1:27017/proyecto-muebles'
];

const checkDB = async (uri) => {
    try {
        const conn = await mongoose.createConnection(uri).asPromise();
        console.log(`\nConnected to: ${uri}`);

        const collections = await conn.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name).join(', '));

        const productColl = collections.find(c => c.name.toLowerCase().includes('producto'));
        if (productColl) {
            console.log(`Found product collection: ${productColl.name}`);
            const count = await conn.collection(productColl.name).countDocuments();
            console.log(`Count: ${count}`);

            const target = await conn.collection(productColl.name).findOne({ codigo: 'ESC-0003' });
            if (target) {
                console.log('!!! FOUND TARGET PRODUCT !!!');
                console.log(JSON.stringify(target, null, 2));
            }
        }
        await conn.close();
    } catch (err) {
        console.log(`Failed ${uri}: ${err.message}`);
    }
};

const run = async () => {
    for (const uri of dbs) {
        await checkDB(uri);
    }
};

run();
