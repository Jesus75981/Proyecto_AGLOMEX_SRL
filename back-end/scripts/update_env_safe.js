import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');
const newUri = 'mongodb+srv://ronaldtumiri66_db_user:u2u9uVCIGnCcFNVG@cluster0.ekaqwz7.mongodb.net/proyecto_muebles?retryWrites=true&w=majority';

try {
    let content = fs.readFileSync(envPath, 'utf8');

    // Convert lines to key-value map to handle duplicates and updates cleanly
    const lines = content.split('\n');
    const envMap = {};
    const otherLines = []; // comments or empty lines

    lines.forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            envMap[match[1].trim()] = match[2].trim();
        } else {
            // Store order? easier to just rebuild.
        }
    });

    // Easier regex replacement to preserve structure (comments etc)
    if (content.includes('MONGO_URI=')) {
        content = content.replace(/^MONGO_URI=.*/m, `MONGO_URI=${newUri}`);
    } else {
        content += `\nMONGO_URI=${newUri}`;
    }

    if (content.includes('MONGODB_URI=')) {
        content = content.replace(/^MONGODB_URI=.*/m, `MONGODB_URI=${newUri}`);
    } else {
        content += `\nMONGODB_URI=${newUri}`;
    }

    fs.writeFileSync(envPath, content);
    console.log('.env updated successfully.');
    console.log('New URI set for MONGO_URI and MONGODB_URI.');

} catch (err) {
    console.error('Error updating .env:', err);
}
