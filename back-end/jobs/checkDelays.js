import cron from 'node-cron';
import Produccion from '../models/produccion.model.js';
import whatsappService from '../services/whatsapp.service.js';

// Run every day at 8:00 AM
cron.schedule('0 8 * * *', async () => {
    console.log('🔍 Checking for delayed production orders...');
    try {
        const ownerNumber = process.env.OWNER_PHONE_NUMBER;
        if (!ownerNumber) {
            console.warn('⚠️ No OWNER_PHONE_NUMBER configured for delay alerts.');
            return;
        }

        const delayedOrders = await Produccion.find({
            estado: 'Retrasado',
            notificacionesEnviadas: false // Or create a new flag like 'alertSent'
        });

        // Or better logic: Find 'En Progreso' or 'Retrasado' that EXCEED time
        const inProgress = await Produccion.find({ estado: { $in: ['En Progreso', 'Retrasado'] }, fechaInicio: { $ne: null } });

        for (const order of inProgress) {
            const now = new Date();
            const elapsedHours = (now - order.fechaInicio) / (1000 * 60 * 60);
            const estimatedHours = order.tiempoEstimado * 24; // Assuming tiempoEstimado is in days

            // Allow 10% buffering before annoying
            if (elapsedHours > estimatedHours * 1.1) {
                // Determine if we should alert (e.g., check if we already alerted today/ever)
                // For simplicty: Just send. Real app might need 'lastAlertDate'

                const delayDays = ((elapsedHours - estimatedHours) / 24).toFixed(1);

                const msg = `⚠️ *Alerta de Retraso*\n\n📋 *Orden:* ${order.nombre}\n🔢 *Numero:* ${order.numeroOrden || order._id}\n⏱️ *Retraso:* ~${delayDays} días\n📅 *Inicio:* ${new Date(order.fechaInicio).toLocaleDateString()}`;

                await whatsappService.sendMessage(ownerNumber, msg);
                console.log(`⚠️ Alert sent for order ${order.nombre}`);
            }
        }
    } catch (error) {
        console.error('❌ Error in delay check job:', error);
    }
});
