import Anticipo from '../models/anticipo.model.js';

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