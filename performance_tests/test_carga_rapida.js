import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';
const CONCURRENT_USERS = 25; 
const TOTAL_REQUESTS = 100;

async function runTest() {
    console.log('====================================================');
    console.log('   SISTEMA AGLOMEX: PRUEBA DE ESTRÉS INTEGRAL       ');
    console.log('   (Login, Finanzas, Logística, Dashboard)          ');
    console.log('====================================================\n');

    // Primero obtenemos un token válido
    let token = '';
    try {
        const login = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        token = login.data.token;
        console.log('✅ Autenticación exitosa. Iniciando ráfaga de peticiones...\n');
    } catch (e) {
        console.error('❌ Error: No se pudo autenticar. Revisa que el servidor esté encendido.');
        return;
    }

    const authHeaders = { headers: { 'Authorization': `Bearer ${token}` } };
    const startTime = Date.now();
    let results = { dash: 0, fin: 0, log: 0, errors: 0 };
    const latencies = [];

    const tasks = Array.from({ length: TOTAL_REQUESTS }).map(async (_, i) => {
        const startReq = Date.now();
        try {
            if (i % 3 === 0) {
                await axios.get(`${BASE_URL}/ventas/estadisticas?year=2025&period=year`, authHeaders);
                results.dash++;
            } else if (i % 3 === 1) {
                await axios.get(`${BASE_URL}/finanzas/estadisticas?year=2025&period=year`, authHeaders);
                results.fin++;
            } else {
                await axios.get(`${BASE_URL}/logistica/estadisticas?year=2025&period=year`, authHeaders);
                results.log++;
            }
            latencies.push(Date.now() - startReq);
        } catch (error) {
            results.errors++;
        }
    });

    for (let i = 0; i < tasks.length; i += CONCURRENT_USERS) {
        await Promise.all(tasks.slice(i, i + CONCURRENT_USERS));
        process.stdout.write('▓'); 
    }

    const totalTime = (Date.now() - startTime) / 1000;
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    console.log('\n\n====================================================');
    console.log('              RESULTADOS DE RENDIMIENTO             ');
    console.log('====================================================');
    console.log(`📊 Dashboard Consultados: ${results.dash}`);
    console.log(`💰 Módulos Finanzas:      ${results.fin}`);
    console.log(`🚛 Módulos Logística:     ${results.log}`);
    console.log(`❌ Fallos detectados:     ${results.errors}`);
    console.log('----------------------------------------------------');
    console.log(`⏱️ Tiempo Total:         ${totalTime.toFixed(2)} seg`);
    console.log(`🚀 Latencia Promedio:     ${avgLatency.toFixed(2)} ms`);
    console.log(`🔥 Capacidad:             ${(TOTAL_REQUESTS / totalTime).toFixed(2)} req/seg`);
    console.log('====================================================');
}

runTest();
