// const fetch = require('node-fetch'); // Native fetch in Node 18+

const API_URL = 'http://localhost:5000/api';

async function runVerification() {
    console.log('Starting Inventory Movements Verification...');

    try {
        // 1. Fetch Products to get a valid Product ID
        console.log('\n1. Fetching Products...');
        const productsRes = await fetch(`${API_URL}/productos`);
        if (!productsRes.ok) throw new Error(`Failed to fetch products: ${productsRes.statusText}`);
        const products = await productsRes.json();

        const product = products.find(p => p.tipo === 'Producto Terminado');
        if (!product) {
            console.error('No "Producto Terminado" found. Please create one first.');
            return;
        }
        console.log(`Selected Product: ${product.nombre} (ID: ${product._id}) - Current Stock: ${product.cantidad}`);

        const initialStock = product.cantidad;

        // 2. Create Movement (Entrada)
        console.log('\n2. Creating Movement (Entrada)...');
        const entradaData = {
            productoId: product._id,
            tipo: 'Entrada',
            cantidad: 10,
            motivo: 'Reposición de stock test',
            referencia: 'REF-TEST-001',
            usuario: 'Test Script'
        };

        const entradaRes = await fetch(`${API_URL}/movimientos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entradaData)
        });

        if (!entradaRes.ok) {
            const err = await entradaRes.json();
            throw new Error(`Failed to create Entrada: ${err.message || entradaRes.statusText}`);
        }
        const entradaResult = await entradaRes.json();
        console.log('Entrada created:', entradaResult);

        // Verify Stock Update
        const productAfterEntradaRes = await fetch(`${API_URL}/productos/${product._id}`);
        const productAfterEntrada = await productAfterEntradaRes.json();
        console.log(`Stock after Entrada: ${productAfterEntrada.cantidad} (Expected: ${initialStock + 10})`);

        if (productAfterEntrada.cantidad !== initialStock + 10) {
            throw new Error('Stock update failed for Entrada');
        }

        // 3. Create Movement (Salida)
        console.log('\n3. Creating Movement (Salida)...');
        const salidaData = {
            productoId: product._id,
            tipo: 'Salida',
            cantidad: 5,
            motivo: 'Venta test',
            referencia: 'REF-TEST-002',
            usuario: 'Test Script'
        };

        const salidaRes = await fetch(`${API_URL}/movimientos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(salidaData)
        });

        if (!salidaRes.ok) {
            const err = await salidaRes.json();
            throw new Error(`Failed to create Salida: ${err.message || salidaRes.statusText}`);
        }
        const salidaResult = await salidaRes.json();
        console.log('Salida created:', salidaResult);

        // Verify Stock Update
        const productAfterSalidaRes = await fetch(`${API_URL}/productos/${product._id}`);
        const productAfterSalida = await productAfterSalidaRes.json();
        console.log(`Stock after Salida: ${productAfterSalida.cantidad} (Expected: ${initialStock + 10 - 5})`);

        if (productAfterSalida.cantidad !== initialStock + 5) {
            throw new Error('Stock update failed for Salida');
        }

        // 4. List Movements
        console.log('\n4. Listing Movements...');
        const movimientosRes = await fetch(`${API_URL}/movimientos`);
        const movimientos = await movimientosRes.json();

        const myMovements = movimientos.filter(m => m.producto?._id === product._id || m.producto === product._id);
        console.log(`Found ${myMovements.length} movements for this product.`);

        const lastMovement = myMovements[myMovements.length - 1];
        console.log('Last movement:', lastMovement);

        if (myMovements.length < 2) {
            throw new Error('Movements not listed correctly');
        }

        console.log('\n✅ Verification Successful!');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error);
    }
}

runVerification();
