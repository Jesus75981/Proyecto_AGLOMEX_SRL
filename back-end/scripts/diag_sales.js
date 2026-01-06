
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const diagSales = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("--- PRODUCTOS ---");
        const productos = await mongoose.connection.db.collection('productotiendas').find({}).toArray();
        productos.forEach(p => {
            console.log(`ID: ${p._id}, Nombre: "${p.nombre}", Activo: ${p.activo}`);
        });

        console.log("\n--- VENTAS ---");
        const ventas = await mongoose.connection.db.collection('ventas').find({}).toArray();
        ventas.forEach(v => {
            console.log(`ID: ${v._id}, Fecha: ${v.fecha}, Estado: ${v.estado}`);
            if (v.productos) {
                v.productos.forEach(vp => {
                    console.log(`   -> ProdID: ${vp.producto}, Cant: ${vp.cantidad}, NombreSnap: "${vp.nombreProducto}"`);
                });
            }
        });

        console.log("\n--- END DIAG ---");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

diagSales();
