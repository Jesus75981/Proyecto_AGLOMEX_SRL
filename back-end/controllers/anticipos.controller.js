import Anticipo from '../models/anticipo.model.js';
import { registrarTransaccionFinanciera } from './finanzas.controller.js';

export const listarAnticipos = async (req, res) => {
  try {
    const anticipos = await Anticipo.find({ activo: true });
    res.json(anticipos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const crearAnticipo = async (req, res) => {
  try {
    const anticipo = new Anticipo(req.body);
    await anticipo.save();

    // REGISTRAR TRANSACCIÓN FINANCIERA: Egreso por anticipo pagado
    await registrarTransaccionFinanciera(
      'egreso',
      'anticipo_pagado',
      `Anticipo pagado - ${anticipo.monto}`,
      anticipo.monto,
      anticipo._id,
      'Anticipo',
      {
        metodoPago: anticipo.metodoPago,
        banco: anticipo.banco
      },
      'BOB', // Moneda: Bolivianos
      1 // Tipo de cambio: 1 para BOB
    );

    res.status(201).json(anticipo);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const actualizarAnticipo = async (req, res) => {
  try {
    const anticipo = await Anticipo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!anticipo) return res.status(404).json({ message: 'Anticipo no encontrado' });
    res.json(anticipo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const eliminarAnticipo = async (req, res) => {
  try {
    const anticipo = await Anticipo.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!anticipo) {
      return res.status(404).json({ message: "Anticipo no encontrado" });
    }
    res.json({ message: "Anticipo desactivado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
