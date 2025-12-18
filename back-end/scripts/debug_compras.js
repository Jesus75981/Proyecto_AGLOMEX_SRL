import mongoose from 'mongoose';
import Compra from '../models/compra.model.js';

// Connection string
const MONGODB_URI = 'mongodb://localhost:27017/mueblesDB';

async function checkCompras() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const compras = await Compra.find().sort({ fecha: -1 }).limit(10);
        console.log(`Found ${compras.length} total purchases (showing last 10).`);

        compras.forEach(c => {
            console.log(`ID: ${c._id}, Num: ${c.numCompra}, Date: ${c.fecha}`);
        });

        const today = new Date();
        const dateStr = today.getFullYear().toString() +
            (today.getMonth() + 1).toString().padStart(2, '0') +
            today.getDate().toString().padStart(2, '0');
        const prefix = `COMP-${dateStr}-`;

        console.log(`Checking for prefix for today: ${prefix}`);
        const todaysPurchases = await Compra.find({
            numCompra: { $regex: `^${prefix}` }
        });
        console.log(`Found ${todaysPurchases.length} purchases for today.`);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

checkCompras();
