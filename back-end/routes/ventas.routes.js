import express from 'express';
import { registrarVenta, listarVentas, getVentasByDay, getEstadisticasVentas, getComprasByDay, eliminarVenta, generarReporteVentas } from '../controllers/ventas.controller.js';

const router = express.Router();

// Crear nueva venta
router.post('/', registrarVenta);

// Obtener todas las ventas
router.get('/', listarVentas);

// Ruta para reporte diario de ventas
router.post('/reporte-diario', getVentasByDay);

// Ruta para estadísticas de ventas (mensuales y anuales)
router.get('/estadisticas', getEstadisticasVentas);

// Ruta para reporte diario de compras
router.post('/reporte-compras-diario', getComprasByDay);

// Ruta para reporte avanzado de ventas
router.post('/reportes', generarReporteVentas);

// Eliminar una venta
router.delete('/:id', eliminarVenta);

export default router;
