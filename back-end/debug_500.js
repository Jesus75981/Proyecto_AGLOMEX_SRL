import http from 'http';

function fetchUrl(path) {
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: path,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            console.log(`Response for ${path}:`);
            console.log(`Status: ${res.statusCode}`);
            console.log('Body:', data);
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request to ${path}: ${e.message}`);
    });

    req.end();
}

fetchUrl('/api/finanzas/estadisticas?year=2024&period=year');
