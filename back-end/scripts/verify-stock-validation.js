// import fetch from 'node-fetch'; // Native fetch in Node 18+

const API_URL = 'http://localhost:5000/api'; // Using main server port

async function runVerification() {
    console.log('🚀 Starting Stock Validation Verification...');

    try {
        // 1. Create Material with limited stock
        console.log('\n1️⃣  Creating Material (Stock: 10)...');
        const materialRes = await fetch(`${API_URL}/productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: `Material Limitado ${Date.now()}`,
                categoria: 'Maderas',
                cantidad: 10,
                precioCompra: 10,
                precioVenta: 15,
                tipo: 'Materia Prima',
                color: 'Natural',
                codigo: `MAT-LIM-${Date.now()}`
            })
        });
        const material = await materialRes.json();
        if (!materialRes.ok) throw new Error(material.message || 'Error creating material');
        console.log(`✅ Material created: ${material.nombre} (ID: ${material._id}) - Stock: ${material.cantidad}`);

        // 2. Try to create order requiring MORE than stock (Should Fail)
        console.log('\n2️⃣  Testing Insufficient Stock (Req: 20, Avail: 10)...');
        const failOrderRes = await fetch(`${API_URL}/produccion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idProduccion: `ORD-FAIL-${Date.now()}`,
                nombre: `Silla Fail ${Date.now()}`,
                cantidad: 1,
                precioCompra: 50,
                precioVenta: 100,
                tiempoEstimado: 24,
                materiales: [{
                    material: material._id,
                    cantidad: 20 // Requires 20, have 10
                }]
            })
        });

        if (failOrderRes.status === 400) {
            const errorData = await failOrderRes.json();
            console.log(`✅ Correctly rejected order! Error: "${errorData.message}"`);
        } else {
            const text = await failOrderRes.text();
            console.error(`❌ Failed! Expected 400, got ${failOrderRes.status}. Response: ${text}`);
            throw new Error('Validation failed: Order was allowed despite insufficient stock');
        }

        // 3. Try to create order requiring LESS than stock (Should Succeed)
        console.log('\n3️⃣  Testing Sufficient Stock (Req: 5, Avail: 10)...');
        const successOrderRes = await fetch(`${API_URL}/produccion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idProduccion: `ORD-OK-${Date.now()}`,
                nombre: `Silla OK ${Date.now()}`,
                cantidad: 1,
                precioCompra: 50,
                precioVenta: 100,
                tiempoEstimado: 24,
                materiales: [{
                    material: material._id,
                    cantidad: 5 // Requires 5, have 10
                }]
            })
        });

        if (successOrderRes.ok) {
            const order = await successOrderRes.json();
            console.log(`✅ Order created successfully: ${order.nombre} (ID: ${order._id})`);
        } else {
            const text = await successOrderRes.text();
            console.error(`❌ Failed! Expected 201, got ${successOrderRes.status}. Response: ${text}`);
            throw new Error('Validation failed: Valid order was rejected');
        }

        console.log('\n🎉 Stock Validation Verification Complete!');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error.message);
    }
}

runVerification();
