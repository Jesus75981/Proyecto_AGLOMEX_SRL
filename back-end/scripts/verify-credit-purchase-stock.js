// import fetch from 'node-fetch'; // Native fetch in Node 18+

const API_URL = 'http://localhost:5004/api'; // Using port 5004

async function runVerification() {
    console.log('🚀 Starting Credit Purchase Stock Verification...');

    try {
        // 1. Create a Test Product (Producto Terminado)
        console.log('\n1️⃣  Creating Test Product...');
        const productRes = await fetch(`${API_URL}/productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: `Producto Credito ${Date.now()}`,
                categoria: 'Sillas',
                cantidad: 10,
                precioCompra: 50,
                precioVenta: 100,
                tipo: 'Producto Terminado',
                color: 'Negro',
                codigo: `PROD-CRED-${Date.now()}`
            })
        });
        const product = await productRes.json();
        if (!productRes.ok) throw new Error(product.message || 'Error creating product');
        console.log(`✅ Product created: ${product.nombre} (ID: ${product._id}) - Initial Stock: ${product.cantidad}`);

        // 2. Create a Provider (if needed, or use existing one)
        // For simplicity, let's assume we need a provider ID. I'll fetch one or create one.
        // Let's try to fetch first.
        let providerId;
        const provRes = await fetch(`${API_URL}/proveedores`);
        const proveedores = await provRes.json();
        if (proveedores.length > 0) {
            providerId = proveedores[0]._id;
        } else {
            // Create one
            const newProvRes = await fetch(`${API_URL}/proveedores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: `Proveedor Test ${Date.now()}`,
                    nit: `NIT-${Date.now()}`,
                    telefono: '12345678',
                    email: 'test@provider.com'
                })
            });
            const newProv = await newProvRes.json();
            providerId = newProv._id;
        }
        console.log(`   Using Provider ID: ${providerId}`);

        // 3. Register a Purchase on CREDIT (Partial Payment)
        console.log('\n2️⃣  Registering Credit Purchase (Buying 5 units)...');
        const purchaseData = {
            tipoCompra: 'Producto Terminado',
            proveedor: providerId,
            fecha: new Date().toISOString(),
            totalCompra: 250, // 5 * 50
            productos: [
                {
                    producto: product._id,
                    cantidad: 5,
                    precioUnitario: 50,
                    nombreProducto: product.nombre, // Redundant but required by controller validation sometimes
                    colorProducto: product.color,
                    categoriaProducto: product.categoria
                }
            ],
            metodosPago: [
                {
                    tipo: 'Crédito',
                    monto: 250 // Full amount on credit
                }
            ]
        };

        const purchaseRes = await fetch(`${API_URL}/compras`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(purchaseData)
        });

        const purchase = await purchaseRes.json();
        if (!purchaseRes.ok) {
            console.error('❌ Purchase failed:', purchase);
            throw new Error(purchase.message || 'Error registering purchase');
        }
        console.log(`✅ Purchase registered: ${purchase.compra.numCompra} - Status: ${purchase.compra.estado} - Pending: ${purchase.compra.saldoPendiente}`);

        // 4. Verify Stock Update
        console.log('\n3️⃣  Verifying Stock Update...');
        const checkRes = await fetch(`${API_URL}/productos/${product._id}`);
        const checkProduct = await checkRes.json();

        console.log(`   Initial Stock: 10`);
        console.log(`   Purchased: 5`);
        console.log(`   Expected Stock: 15`);
        console.log(`   Actual Stock: ${checkProduct.cantidad}`);

        if (checkProduct.cantidad === 15) {
            console.log('✅ Stock updated correctly despite credit purchase!');
        } else {
            console.error('❌ Stock did NOT update correctly!');
            throw new Error('Stock verification failed');
        }

    } catch (error) {
        console.error('\n❌ Verification Failed:', error.message);
    }
}

runVerification();
