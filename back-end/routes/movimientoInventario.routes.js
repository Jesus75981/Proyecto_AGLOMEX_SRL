import express from 'express';
import { crearMovimiento, listarMovimientos } from '../controllers/movimientoInventario.controller.js';

const router = express.Router();

router.post('/', crearMovimiento);
router.get('/', listarMovimientos);

export default router;
