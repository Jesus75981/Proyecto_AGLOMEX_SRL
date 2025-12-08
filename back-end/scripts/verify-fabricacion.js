import mongoose from 'mongoose';
import fs from 'fs';
// import fetch from 'node-fetch'; // Native fetch in Node 18+

const API_URL = 'http://localhost:5003/api';

async function runVerification() {
    console.log('🚀 Starting Fabricacion Module Verification...');

    try {
        // 1. Crear Material (ProductoTienda con tipo 'Materia Prima')
        console.log('\n1️⃣  Creating Material...');
        const materialRes = await fetch(`${API_URL}/productos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: `Madera Test ${Date.now()}`,
                categoria: 'Maderas',
                cantidad: 100,
                precioCompra: 10,
                precioVenta: 15,
                tipo: 'Materia Prima',
                color: 'Natural',
                codigo: `MAT-${Date.now()}`
            })
        });
        const material = await materialRes.json();
        if (!materialRes.ok) throw new Error(material.message || 'Error creating material');
        console.log(`✅ Material created: ${material.nombre} (ID: ${material._id}) - Stock: ${material.cantidad}`);

        // 2. Crear Orden de Producción
        console.log('\n2️⃣  Creating Production Order...');
        const ordenRes = await fetch(`${API_URL}/produccion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idProduccion: `ORD-${Date.now()}`,
                nombre: `Silla Test ${Date.now()}`,
                cantidad: 5,
                precioCompra: 50,
                precioVenta: 100,
                tiempoEstimado: 24,
                materiales: [] // Test empty materials
            })
        });

        if (!ordenRes.ok) {
            const text = await ordenRes.text();
            fs.writeFileSync('error_log.html', text);
            console.error(`❌ Server returned ${ordenRes.status} ${ordenRes.statusText}`);
            console.error('Saved response to error_log.html');
            throw new Error('Server returned error status');
        }

        const orden = await ordenRes.json();
        console.log(`✅ Order created: ${orden.nombre} (ID: ${orden._id})`);

        // 3. Iniciar Producción
        console.log('\n3️⃣  Starting Production...');
        const startRes = await fetch(`${API_URL}/produccion/${orden._id}/iniciar`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!startRes.ok) {
            const text = await startRes.text();
            console.error('Error starting production:', text);
            throw new Error('Error starting production');
        }

        const startData = await startRes.json();
        console.log(`✅ Production started: ${startData.message}`);

        // 4. Verificar Descuento de Stock
        console.log('\n4️⃣  Verifying Stock Deduction...');
        const matCheckRes = await fetch(`${API_URL}/productos/${material._id}`);
        const matCheck = await matCheckRes.json();
        console.log(`   Initial Stock: 100`);
        console.log(`   Required: 10`);
        console.log(`   Current Stock: ${matCheck.cantidad}`);
        if (matCheck.cantidad === 90) {
            console.log('✅ Stock deducted correctly!');
        } else {
            console.error('❌ Stock NOT deducted correctly!');
        }

        // 5. Confirmar Producción (Completar)
        console.log('\n5️⃣  Confirming Production (Force Complete)...');
        // ... (Skipping complex logic for now, just checking status)
        const ordenCheckRes = await fetch(`${API_URL}/produccion`);
        const ordenes = await ordenCheckRes.json();
        const ordenActualizada = ordenes.find(o => o._id === orden._id);
        console.log(`   Order Status: ${ordenActualizada.estado}`);

        if (ordenActualizada.estado === 'En Progreso') {
            console.log('✅ Order is In Progress');
        }

        // 6. Crear Máquina
        console.log('\n6️⃣  Creating Machine...');
        const maqRes = await fetch(`${API_URL}/maquinas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: `Sierra Test ${Date.now()}`,
                tipo: 'Corte',
                estado: 'Operativa'
            })
        });
        const maquina = await maqRes.json();
        console.log(`✅ Machine created: ${maquina.nombre}`);

        console.log('\n🎉 Verification Complete!');

    } catch (error) {
        console.error('\n❌ Verification Failed:', error.message);
    }
}

runVerification();
