const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const localUri = 'mongodb://localhost:27017/proyecto_muebles';

try {
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Replace MONGODB_URI
    if (envContent.includes('MONGODB_URI=')) {
        envContent = envContent.replace(/MONGODB_URI=.*/g, `MONGODB_URI=${localUri}`);
    } else {
        envContent += `\nMONGODB_URI=${localUri}`;
    }

    // Replace MONGO_URI
    if (envContent.includes('MONGO_URI=')) {
        envContent = envContent.replace(/MONGO_URI=.*/g, `MONGO_URI=${localUri}`);
    } else {
        envContent += `\nMONGO_URI=${localUri}`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env actualizado para usar BASE DE DATOS LOCAL.');
    console.log(`URI configurada: ${localUri}`);

} catch (error) {
    console.error('❌ Error actualizando .env:', error);
}
