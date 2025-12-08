


const API_URL = 'http://localhost:5000/api/compras/estadisticas';

async function verifyComprasStats() {
    console.log('🔍 Verificando endpoint de estadísticas de compras...');

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Respuesta recibida correctamente.');

        // Verificar estructura de la respuesta
        if (!data.comprasMensuales || !Array.isArray(data.comprasMensuales)) {
            console.error('❌ Error: comprasMensuales falta o no es un array.');
        } else {
            console.log(`✅ Compras Mensuales: ${data.comprasMensuales.length} registros encontrados.`);
        }

        if (!data.estadisticasGenerales) {
            console.error('❌ Error: estadisticasGenerales falta.');
        } else {
            console.log('✅ Estadísticas Generales encontradas:', data.estadisticasGenerales);
        }

        if (!data.comprasRecientes || !Array.isArray(data.comprasRecientes)) {
            console.error('❌ Error: comprasRecientes falta o no es un array.');
        } else {
            console.log(`✅ Compras Recientes: ${data.comprasRecientes.length} registros encontrados.`);
        }

    } catch (error) {
        console.error('❌ Error al verificar estadísticas:', error.message);
    }
}

verifyComprasStats();
