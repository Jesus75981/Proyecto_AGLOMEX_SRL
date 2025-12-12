
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import ProductoTienda from '../models/productoTienda.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

async function fixPrice() {
    try {
        await mongoose.connect(MONGODB_URI);
        const res = await ProductoTienda.updateOne(
            { nombre: /Escritorio/i, color: /cafe/i },
            {
                $set: {
                    precioCompra: 200
                }
            }
        );
        console.log('Price Update Result:', res);
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
fixPrice();
