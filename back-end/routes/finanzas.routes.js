// routes/finanzas.routes.js
import express from 'express';
const router = express.Router();

// Middleware opcional para control de roles
const adminOnly = (req, res, next) => {
    if (req.user.rol !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. Solo admins.' });
    }
    next();
};

// Ejemplo de endpoint solo para admins
router.get('/resumen', adminOnly, (req, res) => {
    res.json({ 
        mensaje: 'Resumen financiero para admins', 
        data: { ingresos: 10000, egresos: 5000 } 
    });
});

// Ejemplo de endpoint accesible para todos los roles
router.get('/historial', (req, res) => {
    res.json({ 
        mensaje: 'Historial financiero accesible para todos los usuarios', 
        data: [] 
    });
});

// Agrega más rutas aquí...
router.post('/gasto', (req, res) => {
    res.json({ mensaje: 'Gasto registrado' });
});

router.get('/reportes', (req, res) => {
    res.json({ mensaje: 'Reportes financieros' });
});

export default router;