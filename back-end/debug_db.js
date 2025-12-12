
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = 'mongodb://localhost:27017/mueblesDB';

async function listDbs() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const targetDbs = ['mueblesDB', 'aglomex_db', 'Catalogo'];

        for (const dbName of targetDbs) {
            console.log(`\n--- Checking DB: ${dbName} ---`);
            const conn = await mongoose.createConnection(`mongodb://localhost:27017/${dbName}`).asPromise();

            try {
                const count = await conn.collection('productotiendas').countDocuments();
                console.log(`Documents in 'productotiendas': ${count}`);

                if (count > 0) {
                    const newest = await conn.collection('productotiendas').find({}).sort({ createdAt: -1 }).limit(3).toArray();
                    newest.forEach(p => {
                        console.log(`Product: ${p.nombre} | Created: ${p.createdAt} | Activo: ${p.activo} | Cantidad: ${p.cantidad}`);
                    });
                }
            } catch (e) {
                console.log(`Error checking ${dbName}: ${e.message}`);
            } finally {
                await conn.close();
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

listDbs();
