
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import ProductoTienda from '../models/productoTienda.model.js';
import Compra from '../models/compra.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

async function inspectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to DB');

        console.log('\n--- PRODUCTOS ---');
        const productos = await ProductoTienda.find();
        productos.forEach(p => {
            console.log(`ID: ${p._id}`);
            console.log(`Nombre: "${p.nombre}"`);
            console.log(`Color: "${p.color}"`);
            console.log(`Stock: ${p.cantidad}`);
            console.log(`Costo: ${p.precioCompra}`);
            console.log(`Codigo: ${p.codigo}`);
            console.log('---');
        });

        console.log('\n--- COMPRAS RECIENTES ---');
        const compras = await Compra.find().sort({ fecha: -1 }).limit(5).populate('productos.producto');
        compras.forEach(c => {
            console.log(`Compra: ${c.numCompra} (${c.estado})`);
            c.productos.forEach(item => {
                const prodName = item.producto ? item.producto.nombre : 'Producto Borrado/Nulo';
                const prodId = item.producto ? item.producto._id : item.producto;
                console.log(` - Prod: "${item.nombreProducto}" (Ref Name: ${prodName})`);
                console.log(`   ID Ref: ${prodId}`);
                console.log(`   Cant: ${item.cantidad}`);
            });
            console.log('---');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

inspectDB();
