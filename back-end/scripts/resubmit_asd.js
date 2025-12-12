import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Objeto3D from '../models/objetos3d.model.js';
import '../models/productoTienda.model.js'; // Register model
import * as tripoService from '../services/tripo.service.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mueblesDB';

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('--- RECOVERY: RESUBMITTING "asd" ---');

        const objects = await Objeto3D.find().populate({
            path: 'producto',
            match: { nombre: 'asd' }
        });
        const target = objects.find(o => o.producto);

        if (!target) {
            console.error('❌ "asd" not found in 3D objects.');
            process.exit(1);
        }

        console.log(`Found target: ${target.producto.nombre} (ID: ${target._id})`);
        console.log(`Current Source Image: ${target.sourceImage}`);

        let imagePath = target.sourceImage;

        // Handle local paths vs URLs
        // If it's a URL like http://localhost:5000/uploads/..., extract the local path
        if (imagePath.startsWith('http')) {
            // Basic heuristic to get local path if it serves from public/uploads
            // This depends on how it was saved. Usually full URL is saved.
            // But uploadImageToTripo expects a FILE PATH.

            // If tripoService handles URLs (it does, create3DTask accepts URL), we can just pass it.
            // But if it's localhost, Tripo server can't reach it.
            // So we must resolve it to a local file path if it's localhost.
        }

        try {
            console.log('Resubmitting to Tripo...');
            // Attempt to create task again. 
            // Tripo Service's create3DTask handles validation.
            // If it's localhost, we might need to convert it to absolute path if not already.

            // NOTE: The previous controller logic saved the full URL: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
            // We need to convert this back to absolute path for re-upload if Tripo needs it locally
            // OR if create3DTask handles it.

            // Let's rely on create3DTask logic or tripoService.
            // Inspecting tripo.service.js previously:
            // if (imageUrl.includes('localhost')) -> assumes local file, calls uploadImageToTripo
            // uploadImageToTripo expects ABSOLUTE PATH.

            // So we need to reconstruct absolute path from the localhost URL.

            let inputForTripo = imagePath;
            if (imagePath.includes('localhost')) {
                const filename = imagePath.split('/').pop();
                inputForTripo = path.join(process.cwd(), 'public', 'uploads', filename);
                console.log(`Resolved local path: ${inputForTripo}`);
                if (!fs.existsSync(inputForTripo)) {
                    throw new Error(`Local file not found: ${inputForTripo}`);
                }
                const stats = fs.statSync(inputForTripo);
                console.log(`File size: ${stats.size} bytes`);
                if (stats.size === 0) throw new Error("File is empty");
            }

            const newTaskId = await tripoService.create3DTask(inputForTripo);
            console.log(`✅ New Task ID: ${newTaskId}`);

            target.tripoTaskId = newTaskId;
            target.status = 'queued';
            target.glbUrl = null; // Clear old URL
            await target.save();

            console.log('✅ Database updated. Backend should process it automatically.');

        } catch (error) {
            console.error('❌ Resubmission failed:', error.message);
            if (error.response) console.error(error.response.data);
        }

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
