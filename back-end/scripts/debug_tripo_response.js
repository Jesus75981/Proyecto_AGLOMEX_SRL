import * as tripoService from '../services/tripo.service.js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const TASK_ID = '1011964d-568d-4fc3-8de9-7192366ded43';

const run = async () => {
    try {
        console.log(`Checking status for task: ${TASK_ID}`);
        const statusData = await tripoService.getTaskStatus(TASK_ID);
        fs.writeFileSync('tripo_response.json', JSON.stringify(statusData, null, 2));
        console.log('Response written to tripo_response.json');
    } catch (error) {
        console.error("Error:", error.message);
    }
};

run();
