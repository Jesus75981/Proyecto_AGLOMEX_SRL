import dotenv from 'dotenv';
import * as tripoService from '../services/tripo.service.js';

dotenv.config();

// Use a known existing image of a statue/object
const TEST_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Agrippina_bust_Bm.jpg';

(async () => {
    console.log('Testing Tripo API with public URL...');
    try {
        const taskId = await tripoService.create3DTask(TEST_IMAGE);
        console.log(`✅ Success! Task ID: ${taskId}`);
    } catch (error) {
        console.error('❌ Failed:', error.message);
        if (error.response) console.log(JSON.stringify(error.response.data, null, 2));
    }
})();
