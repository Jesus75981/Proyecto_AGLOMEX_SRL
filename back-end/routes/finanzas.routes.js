    const express = require('express');
    const router = express.Router();

    // Asumiendo que tienes un controlador para manejar la lógica
    // const finanzasController = require('../controllers/finanzasController');

    // Define la ruta GET para obtener las transacciones
    // Asegúrate de que esta ruta coincida con lo que tu frontend espera.
    router.get('/transactions', async (req, res) => {
    // Aquí va la lógica para obtener las transacciones de tu base de datos
    // Por ejemplo, usando un modelo de Mongoose
    try {
        const transactions = []; // Reemplaza esto con la llamada a tu base de datos, por ejemplo: await Transaction.find();
        res.json(transactions);
    } catch (error) {
        console.error('Error al obtener las transacciones:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
    });

    module.exports = router;
