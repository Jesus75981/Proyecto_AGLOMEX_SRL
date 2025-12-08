import express from 'express';
import {
    crearMateriaPrima,
    listarMateriasPrimas,
    actualizarMateriaPrima,
    eliminarMateriaPrima,
    buscarMateriaPrimaPorId
} from '../controllers/materiaPrima.controller.js';

const router = express.Router();

// Crear una nueva materia prima
router.post('/', crearMateriaPrima);

// Listar todas las materias primas
router.get('/', listarMateriasPrimas);

// Buscar materia prima por ID
router.get('/:id', buscarMateriaPrimaPorId);

// Actualizar materia prima por ID
router.put('/:id', actualizarMateriaPrima);

// Eliminar materia prima por ID
router.delete('/:id', eliminarMateriaPrima);

export default router;
