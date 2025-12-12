import { Router } from 'express';
import { getCategorias, createCategoria } from '../controllers/categorias.controller.js';

const router = Router();

// GET /api/categorias
router.get('/', getCategorias);

// POST /api/categorias (opcional, protegido si se desea)
router.post('/', createCategoria);

export default router;
