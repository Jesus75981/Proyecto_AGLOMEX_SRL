import nodemailer from 'nodemailer';
import twilio from 'twilio';
import Venta from '../models/venta.model.js';
import Cliente from '../models/cliente.model.js';
import moment from 'moment';

// Configuración de email
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Configuración de Twilio para WhatsApp
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Función para identificar ventas con pagos pendientes
export const identificarPagosPendientes = async () => {
  try {
    // Buscar ventas con método de pago "Credito" que no estén completamente pagadas
    const ventasPendientes = await Venta.find({
      metodoPago: 'Credito',
      anticipo: { $lt: 0 } // Anticipo negativo indica deuda pendiente
    }).populate('cliente');

    const pagosPendientes = [];

    for (const venta of ventasPendientes) {
      const totalVenta = venta.productos.reduce((sum, prod) => sum + prod.precioTotal, 0) +
                        (venta.serviciosAdicionales?.reduce((sum, serv) => sum + serv.costo, 0) || 0);

      const deudaPendiente = totalVenta - Math.abs(venta.anticipo);

      if (deudaPendiente > 0) {
        pagosPendientes.push({
          venta: venta,
          cliente: venta.cliente,
          deudaPendiente: deudaPendiente,
          fechaVenta: venta.fecha,
          diasVencidos: moment().diff(moment(venta.fecha), 'days')
        });
      }
    }

    return pagosPendientes;
  } catch (error) {
    console.error('Error identificando pagos pendientes:', error);
    throw error;
  }
};

// Función para enviar recordatorio por email
export const enviarRecordatorioEmail = async (cliente, venta, deudaPendiente, diasVencidos) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: cliente.email,
      subject: 'Recordatorio de Pago Pendiente - Aglomex',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Recordatorio de Pago Pendiente</h2>
          <p>Estimado ${cliente.nombre},</p>
          <p>Le recordamos que tiene un pago pendiente en nuestro sistema:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Número de Venta:</strong> ${venta.numVenta}</p>
            <p><strong>Fecha de Venta:</strong> ${moment(venta.fecha).format('DD/MM/YYYY')}</p>
            <p><strong>Monto Pendiente:</strong> Bs. ${deudaPendiente.toLocaleString()}</p>
            <p><strong>Días Vencidos:</strong> ${diasVencidos}</p>
          </div>
          <p>Por favor, regularice su situación lo antes posible para evitar inconvenientes.</p>
          <p>Atentamente,<br>Equipo de Aglomex</p>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Recordatorio enviado por email a ${cliente.email}`);
    return true;
  } catch (error) {
    console.error('Error enviando email:', error);
    return false;
  }
};

// Función para enviar recordatorio por WhatsApp
export const enviarRecordatorioWhatsApp = async (cliente, venta, deudaPendiente, diasVencidos) => {
  try {
    const mensaje = `🔔 *Recordatorio de Pago Pendiente - Aglomex*

Estimado ${cliente.nombre},

Tiene un pago pendiente en nuestro sistema:

📄 *Número de Venta:* ${venta.numVenta}
📅 *Fecha:* ${moment(venta.fecha).format('DD/MM/YYYY')}
💰 *Monto Pendiente:* Bs. ${deudaPendiente.toLocaleString()}
⏰ *Días Vencidos:* ${diasVencidos}

Por favor, regularice su situación lo antes posible.

_Equipo de Aglomex_`;

    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${cliente.telefono}`,
      body: mensaje
    });

    console.log(`✅ Recordatorio enviado por WhatsApp a ${cliente.telefono}`);
    return true;
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    return false;
  }
};

// Función principal para enviar recordatorios
export const enviarRecordatoriosPagosPendientes = async () => {
  try {
    console.log('🔍 Buscando pagos pendientes...');

    const pagosPendientes = await identificarPagosPendientes();

    if (pagosPendientes.length === 0) {
      console.log('✅ No hay pagos pendientes para recordar');
      return;
    }

    console.log(`📋 Encontrados ${pagosPendientes.length} pagos pendientes`);

    let emailsEnviados = 0;
    let whatsappsEnviados = 0;

    for (const pago of pagosPendientes) {
      const { cliente, venta, deudaPendiente, diasVencidos } = pago;

      // Enviar por email si tiene email configurado
      if (cliente.email && cliente.email !== '') {
        const emailEnviado = await enviarRecordatorioEmail(cliente, venta, deudaPendiente, diasVencidos);
        if (emailEnviado) emailsEnviados++;
      }

      // Enviar por WhatsApp si tiene teléfono
      if (cliente.telefono && cliente.telefono !== '') {
        const whatsappEnviado = await enviarRecordatorioWhatsApp(cliente, venta, deudaPendiente, diasVencidos);
        if (whatsappEnviado) whatsappsEnviados++;
      }
    }

    console.log(`✅ Recordatorios enviados: ${emailsEnviados} emails, ${whatsappsEnviados} WhatsApps`);

  } catch (error) {
    console.error('❌ Error en envío de recordatorios:', error);
  }
};
