// controllers/finanzas.controller.js
import Finanzas from '../models/finanzas.model.js';

// Obtener todas las transacciones
export const getTransactions = async (req, res) => {
    try {
        const transactions = await Finanzas.find().sort({ date: -1 }); // Ordena de más reciente a más antiguo
        res.json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener transacciones.' });
    }
};

// Crear una nueva transacción
export const createTransaction = async (req, res) => {
    const { type, description, amount, date } = req.body;

    if (!type || !description || !amount) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        const newTransaction = new Finanzas({
            type,
            description,
            amount,
            date: date || Date.now()
        });
        await newTransaction.save();
        res.status(201).json(newTransaction);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al crear la transacción.' });
    }
};

// Obtener una transacción por ID
export const getTransactionById = async (req, res) => {
    const { id } = req.params;
    try {
        const transaction = await Finanzas.findById(id);
        if (!transaction) {
            return res.status(404).json({ message: 'Transacción no encontrada.' });
        }
        res.json(transaction);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener la transacción.' });
    }
};

// Actualizar una transacción
export const updateTransaction = async (req, res) => {
    const { id } = req.params;
    const { type, description, amount, date } = req.body;

    try {
        const updated = await Finanzas.findByIdAndUpdate(
            id,
            { type, description, amount, date },
            { new: true, runValidators: true }
        );

        if (!updated) return res.status(404).json({ message: 'Transacción no encontrada.' });

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al actualizar la transacción.' });
    }
};

// Eliminar una transacción
export const deleteTransaction = async (req, res) => {
    const { id } = req.params;

    try {
        const deleted = await Finanzas.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'Transacción no encontrada.' });

        res.json({ message: 'Transacción eliminada correctamente.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al eliminar la transacción.' });
    }
};
