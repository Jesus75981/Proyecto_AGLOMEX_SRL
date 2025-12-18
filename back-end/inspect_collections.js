
import mongoose from 'mongoose';

const inspect = async (dbName) => {
    const uri = `mongodb://localhost:27017/${dbName}`;
    console.log(`Inspecting ${dbName}...`);
    const conn = await mongoose.createConnection(uri).asPromise();
    const collections = await conn.db.listCollections().toArray();
    console.log('Collections:');
    collections.forEach(c => console.log(`- ${c.name}`));
    await conn.close();
};

const run = async () => {
    await inspect('mueblesDB');
    console.log('---');
    await inspect('proyecto_muebles');
    process.exit(0);
};

run();
