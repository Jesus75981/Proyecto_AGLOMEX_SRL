import * as tripoService from '../services/tripo.service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const TEST_IMAGE_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/Screenshot/Duck.png'; // Imagen de prueba pública

const runTest = async () => {
    console.log('🧪 Iniciando prueba de integración con Tripo AI...');
    console.log(`🔑 API Key configurada: ${process.env.TRIPO_API_KEY ? 'SÍ' : 'NO'}`);

    if (!process.env.TRIPO_API_KEY) {
        console.error('❌ Error: No se encontró TRIPO_API_KEY en .env');
        process.exit(1);
    }

    try {
        // 1. Crear Tarea
        console.log(`\n1️⃣  Enviando imagen a Tripo: ${TEST_IMAGE_URL}`);
        const taskId = await tripoService.create3DTask(TEST_IMAGE_URL);
        console.log(`✅ Tarea creada con ID: ${taskId}`);

        // 2. Polling de estado
        console.log('\n2️⃣  Verificando estado (Polling)...');
        let status = 'queued';
        let attempts = 0;
        const maxAttempts = 10; // Esperar máximo ~20 segundos para la prueba rápida

        while (['queued', 'running'].includes(status) && attempts < maxAttempts) {
            attempts++;
            console.log(`   Intento ${attempts}/${maxAttempts}: Consultando estado...`);

            const taskData = await tripoService.getTaskStatus(taskId);
            status = taskData.status;
            console.log(`   Estado actual: ${status} (Progreso: ${taskData.progress || 0}%)`);

            if (status === 'success') {
                console.log('\n✅ ¡Generación exitosa!');
                console.log('📂 Modelo GLB:', taskData.output.model);
                break;
            } else if (status === 'failed' || status === 'cancelled') {
                console.error('\n❌ La generación falló o fue cancelada.');
                break;
            }

            // Esperar 2 segundos antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (attempts >= maxAttempts) {
            console.log('\n⚠️  Tiempo de espera de prueba agotado (la tarea sigue procesándose en segundo plano).');
        }

    } catch (error) {
        console.error('\n❌ Error durante la prueba:', error.message);
        if (error.response) {
            console.error('Detalles API:', error.response.data);
        }
    }
};

// Ejecutar y esperar
runTest().then(() => console.log('🏁 Prueba finalizada.'));
