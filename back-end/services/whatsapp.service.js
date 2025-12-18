import qrcode from 'qrcode-terminal';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

class WhatsAppService {
    constructor() {
        this.client = null;
        this.qrCode = null;
        this.status = 'DISCONNECTED'; // INITIALIZING, QR_READY, READY, DISCONNECTED
    }

    initialize() {
        if (this.client) return;

        console.log('🔄 Initializing WhatsApp Client...');
        this.status = 'INITIALIZING';

        // Use LocalAuth to save session
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ],
                timeout: 60000
            }
        });

        this.client.on('qr', (qr) => {
            this.qrCode = qr;
            this.status = 'QR_READY';
            console.log('📱 WhatsApp QR Code generated!');
        });

        // ... rest of events ...


        this.client.on('ready', () => {
            this.status = 'READY';
            this.qrCode = null;
            console.log('✅ WhatsApp Client is ready!');
        });

        this.client.on('authenticated', () => {
            console.log('🔑 WhatsApp Authenticated');
            this.status = 'AUTHENTICATED';
        });

        this.client.on('auth_failure', msg => {
            console.error('❌ WhatsApp Auth Failure', msg);
            this.status = 'DISCONNECTED';
        });

        this.client.on('disconnected', (reason) => {
            console.log('❌ WhatsApp Disconnected:', reason);
            this.status = 'DISCONNECTED';
            this.client = null; // Reset client to allow re-init
        });

        console.log('🚀 Launching Puppeteer...');
        this.client.initialize().catch(err => {
            console.error('❌ FATAL ERROR initializing WhatsApp client:', err);
            this.status = 'DISCONNECTED';
        });
    }

    getQr() {
        return this.qrCode;
    }

    getStatus() {
        return this.status;
    }

    async sendMessage(to, message) {
        if (this.status !== 'READY') {
            console.warn('⚠️ Cannot send message: WhatsApp not ready.');
            return false;
        }

        try {
            // Ensure number format (5917XXX@c.us)
            // Remove '+' and spaces
            let number = to.replace(/\D/g, '');
            // Append suffix if missing
            if (!number.includes('@c.us')) {
                number = `${number}@c.us`;
            }

            await this.client.sendMessage(number, message);
            console.log(`📨 WhatsApp message sent to ${to}`);
            return true;
        } catch (error) {
            console.error('❌ Error sending WhatsApp message:', error);
            return false;
        }
    }

    async restart() {
        if (this.client) {
            await this.client.destroy();
            this.client = null;
        }
        this.initialize();
    }
}

export default new WhatsAppService();
