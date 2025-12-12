import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function verifyReports() {
    try {
        console.log('--- Verifying Sales Report API ---');

        // 1. Get all products to pick one
        const productsRes = await axios.get(`${API_URL}/productos`);
        if (productsRes.data.length === 0) {
            console.log('No products found to test filter.');
            return;
        }
        const testProduct = productsRes.data[0];
        console.log(`Testing filter with Product: ${testProduct.nombre} (ID: ${testProduct._id})`);

        // 2. Call Report endpoint with product filter
        const reportRes = await axios.post(`${API_URL}/ventas/reportes`, {
            fechaInicio: '2024-01-01',
            fechaFin: '2025-12-31',
            productoId: testProduct._id
        });

        console.log('Report Response Status:', reportRes.status);
        console.log(`Total Sales Found: ${reportRes.data.resumen.totalVentas}`);

        if (reportRes.data.detalles.length > 0) {
            const firstSale = reportRes.data.detalles[0];
            const hasProduct = firstSale.productos.some(p => p.producto._id === testProduct._id || p.producto === testProduct._id);
            console.log(`First Sale (${firstSale.numVenta}) contains product? ${hasProduct ? 'YES' : 'NO'}`);
        } else {
            console.log('No sales found for this product (Expected if new DB or unused product).');
        }

        console.log('\n--- Verifying Purchases Report API ---');
        const purchaseReportRes = await axios.post(`${API_URL}/compras/reportes`, {
            fechaInicio: '2024-01-01',
            fechaFin: '2025-12-31',
            productoId: testProduct._id
        });
        console.log('Purchase Report Response Status:', purchaseReportRes.status);
        console.log(`Total Purchases Found: ${purchaseReportRes.data.resumen.totalCompras}`);

    } catch (error) {
        console.error('Verification Failed:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

verifyReports();
