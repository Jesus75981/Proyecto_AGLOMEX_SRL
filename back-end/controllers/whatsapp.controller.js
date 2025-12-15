import whatsappService from '../services/whatsapp.service.js';

export const getStatus = (req, res) => {
    res.json({
        status: whatsappService.getStatus(),
        qr: whatsappService.getQr()
    });
};

export const restartService = async (req, res) => {
    try {
        await whatsappService.restart();
        res.json({ message: 'WhatsApp service restarting...' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const sendTestMessage = async (req, res) => {
    const { number, message } = req.body;
    if (!number || !message) {
        return res.status(400).json({ error: 'Number and message required' });
    }
    const success = await whatsappService.sendMessage(number, message);
    if (success) res.json({ message: 'Sent' });
    else res.status(500).json({ error: 'Failed' });
};
