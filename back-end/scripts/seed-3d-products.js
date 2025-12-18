
import mongoose from 'mongoose';
import ProductoTienda from '../models/productoTienda.model.js';
import Objeto3D from '../models/objetos3d.model.js';
import Proveedor from '../models/proveedores.model.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/mueblesDB';

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create a dummy provider if none exists
        let proveedor = await Proveedor.findOne({ nombre: "Proveedor Principal" });
        if (!proveedor) {
            proveedor = await Proveedor.create({
                nombre: "Proveedor Principal",
                contacto: "Juan Perez",
                telefono: "70000001",
                email: "proveedor@aglomex.com"
            });
            console.log("Created dummy provider");
        }

        // Create a Product with a real image URL
        const producto = await ProductoTienda.create({
            idProductoTienda: "PROD-TRIPO-LIVE",
            nombre: "Silla Generada por IA",
            descripcion: "Silla creada automáticamente via Tripo API.",
            precioCompra: 300,
            precioVenta: 450,
            cantidad: 10,
            tipo: "Producto Terminado",
            color: "Gris",
            categoria: "Sillas AI",
            codigo: `TRIPO-${Date.now()}`,
            proveedor: proveedor._id,
            imagen: "https://shop.static.ingka.ikea.com/category-images/Category_office-chairs.jpg",
            dimensiones: { alto: 100, ancho: 50, profundidad: 50 },
            activo: true
        });
        console.log("Created product:", producto.nombre);

        // Call Tripo API
        console.log("Calling Tripo API...");
        const tripoModule = await import('../services/tripo.service.js');
        const taskId = await tripoModule.create3DTask(producto.imagen);
        console.log(`Tripo Task ID: ${taskId}`);

        // Create 3D Object linked to it (initally queued)
        const objeto3D = await Objeto3D.create({
            producto: producto._id,
            sourceImage: producto.imagen,
            tripoTaskId: taskId,
            status: "queued"
        });
        console.log("Created 3D object linked to product (Status: queued)");

        // Update product with reference
        producto.objeto3D = objeto3D._id;
        await producto.save();
        console.log("Updated product with 3D reference");

        console.log("Seeding complete!");

    } catch (err) {
        console.error("Seeding error:", err);
    } finally {
        mongoose.disconnect();
    }
};

seedData();
