import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api/productos?tipo=Producto Terminado';

async function testFetch() {
    try {
        console.log(`Fetching from: ${API_URL}`);
        const response = await fetch(API_URL);
        const data = await response.json();

        console.log(`Status: ${response.status}`);
        console.log(`Found ${data.length} products.`);

        const silla = data.find(p => p.nombre.toLowerCase() === 'silla');
        if (silla) {
            console.log('Found "silla" in API response:', silla);
        } else {
            console.log('"silla" NOT found in API response.');
            console.log('Available names:', data.map(p => p.nombre).join(', '));
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

testFetch();
