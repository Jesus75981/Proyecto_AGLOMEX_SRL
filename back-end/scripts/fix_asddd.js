import mongoose from 'mongoose';
import Objeto3D from '../models/objetos3d.model.js';
import * as tripoService from '../services/tripo.service.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = 'mongodb://localhost:27017/mueblesDB';
const OBJETO_ID = '693426624dbccb1f30b1bc38'; // ID for 'asddd' Objeto3D
const TASK_ID = 'bf5b24bd-bebc-43a7-90fc-14b0ebf1f5f0'; // Tripo Task ID for 'asddd'

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        console.log(`Fetching status for task: ${TASK_ID}`);
        const statusData = await tripoService.getTaskStatus(TASK_ID);

        let glbUrl = "";
        if (statusData.output && statusData.output.pbr_model) {
            glbUrl = statusData.output.pbr_model;
        } else if (statusData.result && statusData.result.pbr_model && statusData.result.pbr_model.url) {
            glbUrl = statusData.result.pbr_model.url;
        } else if (statusData.output && statusData.output.model) {
            glbUrl = statusData.output.model;
        }

        if (glbUrl) {
            console.log(`Found GLB URL: ${glbUrl}`);
            const result = await Objeto3D.findByIdAndUpdate(
                OBJETO_ID,
                { glbUrl: glbUrl, status: 'done' },
                { new: true }
            );
            console.log('Objeto3D updated successfully.');
        } else {
            console.log('Could not find GLB URL in Tripo response.');
            console.log(JSON.stringify(statusData, null, 2));
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.connection.close();
    }
};

run();
