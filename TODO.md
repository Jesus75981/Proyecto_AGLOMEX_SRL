# Automatizaciones del Sistema Aglomex

## 1. Envío automático de recordatorios a clientes con pagos pendientes
- [x] Instalar dependencias: node-cron, nodemailer (para email) y twilio (para WhatsApp)
- [x] Crear módulo de notificaciones (back-end/services/notifications.service.js)
- [x] Implementar función para identificar ventas con pagos pendientes
- [x] Configurar cron job diario para envío de recordatorios
- [x] Integrar con server.js

## 2. Generación y envío diario/semanal de reportes ejecutivos por WhatsApp
- [ ] Crear módulo de reportes (back-end/services/reports.service.js)
- [ ] Implementar funciones para generar reportes resumidos (ventas, producción, finanzas)
- [ ] Configurar conversión de reportes a formato WhatsApp (texto/imagen)
- [ ] Configurar cron jobs diario/semanal para envío automático
- [ ] Integrar con server.js

## 3. Asignación automática de transportistas basada en ubicación, capacidad y disponibilidad
- [ ] Actualizar modelo de transportista para incluir ubicación y capacidad
- [ ] Crear algoritmo de asignación automática en logistica.controller.js
- [ ] Implementar lógica de optimización (distancia, capacidad, disponibilidad)
- [ ] Integrar asignación automática en creación de pedidos

## 4. Respaldos diarios automáticos con notificaciones de estado
- [ ] Instalar mongodb-tools o usar mongoose para backups
- [ ] Crear script de backup (back-end/scripts/backup.js)
- [ ] Configurar cron job diario para backups
- [ ] Implementar notificaciones de éxito/error
- [ ] Integrar con server.js

## Dependencias a instalar
- node-cron: Para tareas programadas
- nodemailer: Para envío de emails
- twilio: Para WhatsApp Business API
- whatsapp-web.js: Alternativa gratuita para WhatsApp
- moment: Para manejo de fechas
