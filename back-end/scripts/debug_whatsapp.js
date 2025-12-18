import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

console.log('🚀 Starting WhatsApp Debug Script...');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true, // Try false if you want to see the browser
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
        // executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Optional: Force Chrome path if generic fails
        timeout: 60000 // Increase timeout
    }
});

client.on('qr', (qr) => {
    console.log('✅ QR RECEIVED!');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ CLIENT READY!');
    process.exit(0);
});

client.on('authenticated', () => {
    console.log('✅ CLIENT AUTHENTICATED!');
});

client.on('auth_failure', msg => {
    console.error('❌ AUTH FAILURE', msg);
});

client.on('disconnected', (reason) => {
    console.log('❌ Client was logged out', reason);
});

console.log('🔄 Initializing client...');
client.initialize().catch(err => {
    console.error('❌ FATAL ERROR initializing client:', err);
});
