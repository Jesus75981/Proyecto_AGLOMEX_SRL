import mongoose from 'mongoose';
import Compra from '../models/compra.model.js';

const MONGODB_URI = 'mongodb://localhost:27017/mueblesDB';

async function verifyLogic() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        // The EXACT query we added to the controller
        const ultimaCompra = await Compra.findOne({}).sort({ fecha: -1, _id: -1 });
        console.log('Last Purchase Found:', ultimaCompra ? ultimaCompra.numCompra : 'None');

        let nextNum = 1;
        if (ultimaCompra && ultimaCompra.numCompra) {
            const parts = ultimaCompra.numCompra.split('-');
            const lastNumStr = parts[parts.length - 1]; // Tomar la última parte

            if (!isNaN(lastNumStr)) {
                nextNum = parseInt(lastNumStr, 10) + 1;
            }
        }

        const today = new Date();
        const dateStr = today.getFullYear().toString() +
            (today.getMonth() + 1).toString().padStart(2, '0') +
            today.getDate().toString().padStart(2, '0');
        const prefix = `COMP-${dateStr}-`;
        const siguienteNumero = `${prefix}${nextNum.toString().padStart(4, '0')}`;

        console.log('Calculated Next Number:', siguienteNumero);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

verifyLogic();
