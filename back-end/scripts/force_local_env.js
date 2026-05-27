import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');

const content = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/proyecto_muebles
MONGO_URI=mongodb://localhost:27017/proyecto_muebles
JWT_SECRET=super_secret_jwt_key_local_12345
`;

fs.writeFileSync(envPath, content, 'utf8');
console.log('✅ FORCED .env to LOCAL configuration.');
console.log(content);
