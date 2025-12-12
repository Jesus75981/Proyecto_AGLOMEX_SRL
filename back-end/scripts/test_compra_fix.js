
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const PROVEEDOR_ID = '6900bc4795f4e8c7a6f0cabe'; // ID fetched previously

async function testCompra() {
    const uniqueName = `TestProd-${Date.now()}`;

    const purchaseData = {
        fecha: new Date().toISOString(),
        tipoCompra: 'Producto Terminado',
        proveedor: PROVEEDOR_ID,
        productos: [
            {
                nombreProducto: uniqueName, // New unique product
                colorProducto: 'Negro',
                categoriaProducto: 'Sillas',
                cantidad: 10,
                precioUnitario: 50,
                // No productoId, so it should trigger encontrarOCrearProducto
                onModel: 'ProductoTienda'
            }
        ],
        totalCompra: 500,
        metodosPago: [
            { tipo: 'Efectivo', monto: 500 }
        ],
        observaciones: 'Test automatic creation'
    };

    try {
        console.log('Sending purchase request...');
        const response = await axios.post(`${API_URL}/compras`, purchaseData);
        console.log('Purchase Success:', response.status);
        console.log('Purchase Num:', response.data.compra.numCompra);

        // Test 2: Try again with same product name (should reuse)
        console.log('Sending SECOND purchase request (reuse product)...');
        const response2 = await axios.post(`${API_URL}/compras`, purchaseData);
        console.log('Purchase 2 Success:', response2.status);
        console.log('Purchase 2 Num:', response2.data.compra.numCompra);

    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        } else {
            console.error('Request failed:', error.message);
        }
    }
}

testCompra();
