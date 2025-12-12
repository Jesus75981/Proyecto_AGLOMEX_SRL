// scripts/verify_tripo_upload.js
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// Asegúrate de tener una imagen de prueba
const TEST_IMAGE_PATH = path.join(process.cwd(), 'scripts', 'test_image.jpg');

async function createTestImage() {
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
        // Crear una imagen dummy si no existe
        const buffer = Buffer.from('fake image content');
        fs.writeFileSync(TEST_IMAGE_PATH, buffer);
    }
}

async function verifyUpload() {
    await createTestImage();

    const form = new FormData();
    form.append('nombre', 'Producto Test Tripo ' + Date.now());
    form.append('color', 'Rojo');
    form.append('categoria', 'Sillas');
    form.append('codigo', 'TEST-' + Date.now());
    form.append('tipo', 'Producto Terminado');
    form.append('cajas', 1);
    form.append('imagen', fs.createReadStream(TEST_IMAGE_PATH));

    // Dimensiones requeridas
    form.append('dimensiones[alto]', 100);
    form.append('dimensiones[ancho]', 50);
    form.append('dimensiones[profundidad]', 50);

    try {
        console.log('Enviando solicitud POST a /api/productos...');
        const response = await axios.post('http://localhost:5000/api/productos', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('Respuesta del servidor:', response.status);
        console.log('Producto creado:', response.data.nombre);
        console.log('Imagen guardada en:', response.data.imagen);

        if (response.status === 201 && response.data.imagen.includes('/uploads/')) {
            console.log('✅ Upload exitoso.');
            console.log('⏳ Verifica en la consola del backend si apareció: "[TRIPO] Tarea creada: ..."');
        } else {
            console.error('❌ Falló la verificación de respuesta.');
        }

    } catch (error) {
        console.error('ERROR_DETALLE:', error.response ? JSON.stringify(error.response.data) : error.message);
    }
}

verifyUpload();
