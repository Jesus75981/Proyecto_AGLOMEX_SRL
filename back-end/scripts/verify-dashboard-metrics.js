import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

async function verifyMetrics() {
    console.log('🚀 Verifying Dashboard Metrics...');

    try {
        // 1. Login
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'dueno', password: 'admin123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;
        if (!token) throw new Error('Login failed');
        console.log('✅ Login successful');

        const headers = { 'Authorization': `Bearer ${token}` };

        // 2. Fetch Metrics
        console.log('\nFetching Metrics (/alertas/metricas)...');
        const metricasRes = await fetch(`${API_URL}/alertas/metricas`, { headers });
        const metricas = await metricasRes.json();

        console.log('Metrics received:', JSON.stringify(metricas, null, 2));

        if (metricas.totalItemsMateriaPrima !== undefined) {
            console.log(`✅ Success: Materia Prima included in metrics.`);
            console.log(`   - Raw Materials: ${metricas.totalItemsMateriaPrima}`);
            console.log(`   - Finished Products: ${metricas.totalItemsAcabados}`);
            console.log(`   - Total Inventory Value: ${metricas.valorTotalInventario}`);
        } else {
            console.error('❌ Failure: totalItemsMateriaPrima missing from response.');
        }

        // 3. Fetch Alerts
        console.log('\nFetching Alerts (/alertas/stock)...');
        const alertasRes = await fetch(`${API_URL}/alertas/stock`, { headers });
        const alertasData = await alertasRes.json();

        const mpAlerts = alertasData.alertas.filter(a => a.origen === 'materia_prima');
        console.log(`Found ${mpAlerts.length} alerts for Materia Prima.`);
        if (mpAlerts.length > 0) {
            console.log('✅ Alerts for Raw Materials are working.');
            console.log('Sample:', mpAlerts[0]);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verifyMetrics();
