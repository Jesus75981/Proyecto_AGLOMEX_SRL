import express from 'express';
import { obtenerAlertasStock, obtenerMetricasInventario } from '../controllers/alertas.controller.js';

const router = express.Router();

// Ruta para obtener alertas de stock bajo y agotado
router.get('/stock', obtenerAlertasStock);

// Ruta para obtener métricas generales del inventario
router.get('/metricas', obtenerMetricasInventario);

export default router;
