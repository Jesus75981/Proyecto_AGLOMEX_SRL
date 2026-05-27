import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '..', '.env');

// We switch to 'mueblesDB' as requested by user
const content = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/mueblesDB
MONGO_URI=mongodb://localhost:27017/mueblesDB
JWT_SECRET=super_secret_jwt_key_local_12345
`;

fs.writeFileSync(envPath, content, 'utf8');
console.log('✅ .env updated to use database: mueblesDB');
