import express from 'express';
import {
    crearMateriaPrima,
    listarMateriasPrimas,
    actualizarMateriaPrima,
    eliminarMateriaPrima,
    buscarMateriaPrimaPorId,
    obtenerCategorias
} from '../controllers/materiaPrima.controller.js';
import { uploadImage } from '../controllers/productoTienda.controller.js';

const router = express.Router();

// Crear una nueva materia prima
router.post('/', uploadImage, crearMateriaPrima);

// Listar categorías disponibles
router.get('/categorias', obtenerCategorias);

// Listar todas las materias primas
router.get('/', listarMateriasPrimas);

// Buscar materia prima por ID
router.get('/:id', buscarMateriaPrimaPorId);

// Actualizar materia prima por ID
router.put('/:id', uploadImage, actualizarMateriaPrima);

// Eliminar materia prima por ID
router.delete('/:id', eliminarMateriaPrima);

export default router;
