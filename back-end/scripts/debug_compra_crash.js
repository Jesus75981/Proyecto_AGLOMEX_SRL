
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { registrarCompra } from '../controllers/compras.controller.js';
import Proveedor from '../models/proveedores.model.js';
import ProductoTienda from '../models/productoTienda.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

// Mock Express Request/Response
const req = { body: {} };
const res = {
    status: (code) => ({
        json: (data) => console.log(`RESPONSE [${code}]:`, JSON.stringify(data, null, 2))
    })
};

async function runTest() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to DB');

        // 1. Get or Create Provider
        let proveedor = await Proveedor.findOne();
        if (!proveedor) {
            proveedor = await new Proveedor({
                nombre: "Proveedor Test",
                nit: "123456789",
                contacto: { telefono: "77777777" }
            }).save();
            console.log('Created Dummy Provider:', proveedor._id);
        } else {
            console.log('Using Existing Provider:', proveedor._id);
        }

        // 2. Prepare Purchase Data
        req.body = {
            fecha: new Date(),
            tipoCompra: "Producto Terminado",
            proveedor: proveedor._id.toString(),
            productos: [
                {
                    // Simulate a NEW product (no ID, or stale ID)
                    producto: null,
                    nombreProducto: "Silla Gamer Debug",
                    colorProducto: "Rojo",
                    categoriaProducto: "Sillas",
                    cantidad: 10,
                    precioUnitario: 500,
                    precioVenta: 700,
                    codigo: "SG-DEBUG-001",
                    cajas: "1",
                    dimensiones: { alto: 100, ancho: 50, profundidad: 50 },
                    imagenProducto: ""
                }
            ],
            metodosPago: [
                { tipo: "Efectivo", monto: 5000, cuenta: "" }
            ],
            totalCompra: 5000,
            observaciones: "Test Debug Script"
        };

        console.log('🚀 Executing registrarCompra...');
        await registrarCompra(req, res);

    } catch (error) {
        console.error('❌ CRASH CAUSED BY:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runTest();
