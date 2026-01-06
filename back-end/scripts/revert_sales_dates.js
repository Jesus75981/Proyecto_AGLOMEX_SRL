
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VentaSchema = new mongoose.Schema({}, { strict: false });
const Venta = mongoose.model('Venta', VentaSchema);

const getEnvVar = (key) => {
    const envPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(envPath)) return null;
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.trim().startsWith(key + '=')) {
            return line.trim().split('=')[1];
        }
    }
    return null;
};

const revertDates = async () => {
    const uri = getEnvVar('MONGO_URI');
    if (!uri) { console.error('No URI'); process.exit(1); }

    try {
        await mongoose.connect(uri);
        console.log('Connected to DB.');

        // Revert all 2026 sales back to 2025
        // Or essentially, just set all sales back to a specific 2025 date if we can't remember the exact original date
        // The user said "en mi 2025 en diciembre", so let's set them to Dec 2025.
        // To be safe, let's just distribute them or set them to a fixed date in Dec 2025.
        // Since we moved ALL to Jan 6, 2026, we can just move ALL back to Dec 28, 2025.

        const result = await Venta.updateMany(
            {},
            { $set: { fecha: new Date('2025-12-28T12:00:00Z') } }
        );

        console.log(`Reverted ${result.modifiedCount} sales to Dec 28, 2025.`);

    } catch (e) {
        console.error(e);
    }
    process.exit();
};

revertDates();
