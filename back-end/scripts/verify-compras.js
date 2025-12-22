import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

async function verifyCompras() {
    console.log('🚀 Verifying Compras Module...');

    try {
        // Login
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'dueno', password: 'admin123' })
        });
        const token = (await loginRes.json()).token;
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch Compras
        console.log('\nFetching Compras Statistics...');
        const res = await fetch(`${API_URL}/compras/estadisticas?year=2025&period=year`, { headers });
        const data = await res.json();

        console.log('Compras Data Keys:', Object.keys(data));
        console.log('Compras Mensuales (First 3):', JSON.stringify(data.comprasMensuales?.slice(0, 3) || [], null, 2));

        if (data.comprasMensuales && data.comprasMensuales.length > 0) {
            const item = data.comprasMensuales[0];
            console.log('\nChecking Keys for Chart:');
            console.log(`- totalPagado: ${item.totalPagado} (${typeof item.totalPagado})`);
            console.log(`- totalPendiente: ${item.totalPendiente} (${typeof item.totalPendiente})`);
            console.log(`- period: ${JSON.stringify(item.period)}`);
        } else {
            console.warn('⚠️ No monthly data returned.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verifyCompras();
