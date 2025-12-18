import mongoose from 'mongoose';
import ProductoTienda from '../models/productoTienda.model.js';

const MONGODB_URI = 'mongodb://localhost:27017/mueblesDB';

async function checkTipo() {
    try {
        await mongoose.connect(MONGODB_URI);

        console.log("--- Checking 'silla' Type ---");
        const products = await ProductoTienda.find({ nombre: /silla/i });
        products.forEach(p => {
            console.log(`Name: "${p.nombre}", Type: "${p.tipo}", Active: ${p.activo}, Qty: ${p.cantidad}`);
        });

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

checkTipo();
