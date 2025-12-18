
import mongoose from 'mongoose';
import Venta from './models/venta.model.js';
import Compra from './models/compra.model.js';
import Finanzas from './models/finanzas.model.js';

const MONGODB_URI = 'mongodb://localhost:27017/proyecto_muebles';

const checkCounts = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const ventasCount = await Venta.countDocuments();
        const comprasCount = await Compra.countDocuments();
        const finanzasCount = await Finanzas.countDocuments();

        console.log('--- DATABASE COUNTS ---');
        console.log(`Ventas: ${ventasCount}`);
        console.log(`Compras: ${comprasCount}`);
        console.log(`Finanzas: ${finanzasCount}`);
        console.log('-----------------------');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkCounts();
