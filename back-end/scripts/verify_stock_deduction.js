
import mongoose from 'mongoose';
import axios from 'axios';
import ProductoTienda from '../models/productoTienda.model.js';
// Adjust path to models if necessary. Script will be in root or scripts folder.
// Let's assume we run it from root.

const MONGO_URI = 'mongodb://127.0.0.1:27017/mueblesDB'; // Use the URI from server.js

const runTest = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Get a product to test
        const product = await ProductoTienda.findOne({ cantidad: { $gt: 5 } });
        if (!product) {
            console.log('No suitable product found for testing (need > 5 stock).');
            return;
        }

        console.log(`Initial Product: ${product.nombre}, Stock: ${product.cantidad}, ID: ${product._id}`);
        const initialStock = product.cantidad;
        const sellQuantity = 2;

        // 2a. Login to get token
        console.log('Logging in...');
        let token;
        try {
            const loginRes = await axios.post('http://127.0.0.1:5000/api/auth/login', {
                username: 'dueno',
                password: 'admin123'
            });
            token = loginRes.data.token;
            console.log('Logged in successfully.');
        } catch (loginError) {
            console.error('Login Failed:', loginError.response ? loginError.response.data : loginError.message);
            process.exit(1);
        }

        // 3. Create Sale Payload
        const salePayload = {
            cliente: null, // Optional
            productos: [
                {
                    producto: product._id,
                    cantidad: sellQuantity,
                    precioUnitario: product.precioVenta,
                    precioTotal: product.precioVenta * sellQuantity
                }
            ],
            fecha: new Date().toISOString(),
            metodosPago: [
                {
                    tipo: 'Efectivo',
                    monto: product.precioVenta * sellQuantity
                }
            ],
            metodoEntrega: 'Recojo en Tienda',
            numFactura: `TEST-${Date.now()}`,
            observaciones: 'Test stock deduction'
        };

        // 4. Send Request
        // Assuming server is running on localhost:5000
        console.log('Sending sale request...');
        try {
            const response = await axios.post('http://127.0.0.1:5000/api/ventas', salePayload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Sale API Response:', response.status, response.data.msg);
        } catch (apiError) {
            console.error('API Error:', apiError.response ? apiError.response.data : apiError.message);
            process.exit(1);
        }

        // 4. Verify Stock
        const updatedProduct = await ProductoTienda.findById(product._id);
        console.log(`Updated Product: ${updatedProduct.nombre}, Stock: ${updatedProduct.cantidad}`);

        if (updatedProduct.cantidad === initialStock - sellQuantity) {
            console.log('✅ SUCCESS: Stock deduced correctly.');
        } else {
            console.log('❌ FAILURE: Stock mismatch.');
            console.log(`Expected: ${initialStock - sellQuantity}, Got: ${updatedProduct.cantidad}`);
        }

    } catch (error) {
        console.error('Script Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
