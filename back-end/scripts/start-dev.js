
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB Configuration
const MONGO_BIN = 'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe';
const DB_PATH = path.join(__dirname, '..', 'data', 'local_db'); // Cloned data
// const DB_PATH = 'C:\\Program Files\\MongoDB\\Server\\8.0\\data'; // Original data (Access Denied)

// Ensure DB directory exists
if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH, { recursive: true });
}

console.log('🚀 Inicializando entorno de desarrollo...');
console.log(`📂 Base de datos: ${DB_PATH}`);

// Start MongoDB
console.log('🍃 Iniciando MongoDB...');
const mongod = spawn(MONGO_BIN, ['--dbpath', DB_PATH, '--bind_ip', '127.0.0.1']);

let mongoStarted = false;

mongod.stdout.on('data', (data) => {
    const output = data.toString();
    // Detectar cuando Mongo está listo (aunque nodemon iniciará igual)
    if (!mongoStarted && output.includes('Waiting for connections')) {
        console.log('✅ MongoDB está listo y esperando conexiones.');
        mongoStarted = true;
    }
});

mongod.stderr.on('data', (data) => {
    // MongoDB loguea mucha información en stderr, no necesariamente errores críticos.
    // Solo mostramos si parece un error fatal o para depuración.
    console.error(`[MongoDB]: ${data}`);
});

mongod.on('close', (code) => {
    console.log(`MongoDB proceso terminado con código ${code}`);
});

// Start Backend (Nodemon)
console.log('⚡ Iniciando Servidor Backend...');
const nodemon = spawn('npx', ['nodemon', 'server.js'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..') // Ensure running from back-end root
});

// Handle forceful shutdown
const shutdown = () => {
    console.log('\n🛑 Cerrando servicios...');
    if (mongod) {
        mongod.kill();
        // En Windows, kill() a veces no mata el árbol de procesos, pero mongod suele cerrar bien.
    }
    if (nodemon) {
        nodemon.kill();
    }
    process.exit();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
