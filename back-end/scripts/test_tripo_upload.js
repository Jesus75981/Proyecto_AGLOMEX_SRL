import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

dotenv.config();

const API_KEY = process.env.TRIPO_API_KEY;
const TRIPO_API_URL = 'https://api.tripo3d.ai/v2/openapi';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a dummy image if it doesn't exist
const dummyImagePath = path.join(__dirname, 'test_image.jpg');

if (!fs.existsSync(dummyImagePath)) {
    // Create a simple text file as a placeholder (Tripo might reject it if it validates strictly, but let's try or use a real image if possible)
    // Better to download a real image first
    console.log("Downloading dummy image...");
    const writer = fs.createWriteStream(dummyImagePath);
    const response = await axios({
        url: 'https://placehold.co/400x400/png',
        method: 'GET',
        responseType: 'stream'
    });
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

const testUpload = async () => {
    try {
        console.log(`Testing upload with API Key: ${API_KEY ? 'Present' : 'Missing'}`);

        // 1. Upload File
        const formData = new FormData();
        formData.append('file', fs.createReadStream(dummyImagePath));

        console.log("Uploading file...");
        const uploadResponse = await axios.post(
            `${TRIPO_API_URL}/upload`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    ...formData.getHeaders()
                }
            }
        );

        console.log("Upload Response:", uploadResponse.data);

        if (uploadResponse.data.code !== 0) {
            throw new Error(`Upload failed: ${uploadResponse.data.message}`);
        }

        const imageToken = uploadResponse.data.data.image_token;
        console.log(`Image Token: ${imageToken}`);

        // 2. Create Task with Token
        console.log("Creating task with token...");
        const taskResponse = await axios.post(
            `${TRIPO_API_URL}/task`,
            {
                type: 'image_to_model',
                file: {
                    type: 'jpg',
                    file_token: imageToken // Check if parameter is file_token or something else
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("Task Response:", taskResponse.data);

    } catch (error) {
        console.error("Error:", error.response ? error.response.data : error.message);
    }
};

testUpload();
