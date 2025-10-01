import express from 'express';
import Venta from '../models/venta.model.js';

const router = express.Router();

// Crear nueva venta
router.post('/', async (req, res) => {
    try {
        const venta = new Venta(req.body);
        await venta.save();
        res.status(201).json(venta);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Obtener todas las ventas
router.get('/', async (req, res) => {
    try {
        const ventas = await Venta.find().populate('cliente productos.producto');
        res.json(ventas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
