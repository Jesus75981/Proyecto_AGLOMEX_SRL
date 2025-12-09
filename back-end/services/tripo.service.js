import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const TRIPO_API_URL = 'https://api.tripo3d.ai/v2/openapi';

/**
 * Sube una imagen local a Tripo AI para obtener un token.
 * @param {string} filePath - Ruta absoluta del archivo local.
 * @returns {Promise<string>} - Token de la imagen subida.
 */
const uploadImageToTripo = async (filePath) => {
    const API_KEY = process.env.TRIPO_API_KEY;
    if (!fs.existsSync(filePath)) {
        throw new Error(`El archivo no existe: ${filePath}`);
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));

    try {
        const response = await axios.post(
            `${TRIPO_API_URL}/upload`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    ...formData.getHeaders()
                }
            }
        );

        if (response.data && response.data.code === 0) {
            return response.data.data.image_token;
        } else {
            throw new Error(`Error subiendo imagen a Tripo: ${response.data.message}`);
        }
    } catch (error) {
        console.error("Error en uploadImageToTripo:", error.response ? error.response.data : error.message);
        throw error;
    }
};

/**
 * Crea una tarea de conversión de imagen a 3D en Tripo AI.
 * @param {string} imageUrl - URL de la imagen (puede ser localhost o pública).
 * @returns {Promise<string>} - ID de la tarea creada.
 */
export const create3DTask = async (imageUrl) => {
    const API_KEY = process.env.TRIPO_API_KEY;
    if (!API_KEY) {
        throw new Error("TRIPO_API_KEY no está configurada en las variables de entorno.");
    }

    try {
        let payload = { type: 'image_to_model' };

        // Verificar si es una URL local (localhost)
        if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
            // Extraer el nombre del archivo y construir la ruta local
            // Asumimos que la URL es tipo http://localhost:5000/uploads/filename.jpg
            const filename = imageUrl.split('/').pop();
            const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

            console.log(`[TRIPO] Detectada URL local. Subiendo archivo: ${filePath}`);
            const imageToken = await uploadImageToTripo(filePath);

            payload.file = {
                type: 'jpg', // Tripo detecta el tipo, pero requiere este campo
                file_token: imageToken
            };
        } else {
            // URL pública
            payload.file = {
                type: 'jpg',
                url: imageUrl
            };
        }

        const response = await axios.post(
            `${TRIPO_API_URL}/task`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data && response.data.code === 0) {
            return response.data.data.task_id;
        } else {
            throw new Error(`Error de Tripo: ${response.data.message}`);
        }
    } catch (error) {
        console.error("Error al crear tarea en Tripo:", error.response ? error.response.data : error.message);
        throw error;
    }
};

/**
 * Obtiene el estado de una tarea en Tripo AI.
 * @param {string} taskId - ID de la tarea.
 * @returns {Promise<Object>} - Objeto con el estado y resultado (si existe).
 */
export const getTaskStatus = async (taskId) => {
    const API_KEY = process.env.TRIPO_API_KEY;
    if (!API_KEY) {
        throw new Error("TRIPO_API_KEY no está configurada.");
    }

    try {
        const response = await axios.get(
            `${TRIPO_API_URL}/task/${taskId}`,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`
                }
            }
        );

        if (response.data && response.data.code === 0) {
            return response.data.data;
        } else {
            throw new Error(`Error al consultar Tripo: ${response.data.message}`);
        }
    } catch (error) {
        console.error(`Error al consultar tarea ${taskId}:`, error.response ? error.response.data : error.message);
        throw error;
    }
};
