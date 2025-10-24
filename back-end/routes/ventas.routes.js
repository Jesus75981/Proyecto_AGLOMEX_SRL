import express from 'express';
import { registrarVenta, listarVentas, getVentasByDay } from '../controllers/ventas.controller.js';

const router = express.Router();

// Crear nueva venta
router.post('/', registrarVenta);

// Obtener todas las ventas
router.get('/', listarVentas);

// Ruta para reporte diario de ventas
router.post('/reporte-diario', getVentasByDay);

export default router;
