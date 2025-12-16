import express from 'express';
import {
    getAll,
    getById,
    create,
    update,
    deletePedido,
    getEnviosActivos,
    getVentasPendientesEnvio, // Import new controller
    updateEstadoEnvio,
    getRutas,
    createRuta,
    updateRuta,
    deleteRuta,
    obtenerEstadisticas
} from '../controllers/logistica.controller.js';

const router = express.Router();

// Rutas para logística
router.get('/', getAll);
router.get('/estadisticas', obtenerEstadisticas);
router.get('/:id', getById);
router.post('/', create);
router.patch('/:id', update);
router.delete('/:id', deletePedido);

// Rutas específicas para envíos
router.get('/envios/activos', getEnviosActivos);
router.get('/ventas/pendientes', getVentasPendientesEnvio); // New route
router.patch('/envios/:id/estado', updateEstadoEnvio);

// Rutas para rutas de distribución
router.get('/rutas', getRutas);
router.post('/rutas', createRuta);
router.patch('/rutas/:id', updateRuta);
router.delete('/rutas/:id', deleteRuta);

export default router;
