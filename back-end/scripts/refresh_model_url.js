import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as tripoService from '../services/tripo.service.js';
import Objeto3D from '../models/objetos3d.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mueblesDB';
const TARGET_TASK_ID = '87b99dea-96f0-4fe6-a94f-4a00508f7ce1'; // ID found in previous step

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log(`[REFRESH] Fetching status for task: ${TARGET_TASK_ID}`);

        try {
            const statusData = await tripoService.getTaskStatus(TARGET_TASK_ID);
            console.log('[REFRESH] Status Response:', statusData.status);

            let newUrl = null;
            if (statusData.output && statusData.output.pbr_model) {
                newUrl = statusData.output.pbr_model;
            } else if (statusData.result && statusData.result.pbr_model && statusData.result.pbr_model.url) {
                newUrl = statusData.result.pbr_model.url;
            } else if (statusData.output && statusData.output.model) {
                newUrl = statusData.output.model;
            }

            if (newUrl) {
                console.log('[REFRESH] New URL found:', newUrl.substring(0, 50) + '...');
                const result = await Objeto3D.updateOne(
                    { tripoTaskId: TARGET_TASK_ID },
                    { $set: { glbUrl: newUrl, status: 'done' } }
                );
                console.log('[REFRESH] Database update result:', result);
                console.log('✅ URL updated successfully!');
            } else {
                console.error('❌ No model URL found in Trpo response.');
            }

        } catch (error) {
            console.error('❌ Error refreshing URL:', error.message);
            if (error.response) console.error(error.response.data);
        }

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
