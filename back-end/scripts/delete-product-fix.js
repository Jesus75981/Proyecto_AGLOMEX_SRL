
import mongoose from 'mongoose';
import ProductoTienda from '../models/productoTienda.model.js';

const run = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/mueblesDB');
        console.log('Connected to MongoDB');

        const codeToDelete = 'PROD-ESTANTE-1767219812598';

        // Check if it exists
        const product = await ProductoTienda.findOne({ codigo: codeToDelete });

        if (!product) {
            // Try searching by idProductoTienda just in case
            const productById = await ProductoTienda.findOne({ idProductoTienda: codeToDelete });
            if (!productById) {
                console.log(`Product with code/id ${codeToDelete} not found.`);
                process.exit(0);
            } else {
                console.log(`Product found by ID: ${productById.nombre} (${productById.codigo})`);
                await ProductoTienda.findByIdAndDelete(productById._id);
                console.log('Product deleted successfully.');
            }

        } else {
            console.log(`Product found by Code: ${product.nombre} (${product.codigo})`);
            await ProductoTienda.findByIdAndDelete(product._id);
            console.log('Product deleted successfully.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
};

run();
