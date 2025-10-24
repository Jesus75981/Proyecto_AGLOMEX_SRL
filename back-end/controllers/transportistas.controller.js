import Transportista from "../models/transportista.model.js";

// Crear un nuevo transportista
export const crearTransportista = async (req, res) => {
  try {
    const transportista = new Transportista(req.body);
    await transportista.save();
    res.status(201).json(transportista);
  } catch (error) {
    console.error('Error creando transportista:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Ya existe un transportista con este nombre o email.' });
    }
    res.status(500).json({ error: 'Error interno del servidor al crear transportista.' });
  }
};

// Listar todos los transportistas
export const listarTransportistas = async (req, res) => {
  try {
    const transportistas = await Transportista.find().sort({ nombre: 1 });
    res.json(transportistas);
  } catch (error) {
    console.error('Error listando transportistas:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener transportistas activos
export const listarTransportistasActivos = async (req, res) => {
  try {
    const transportistas = await Transportista.find({ estado: "Activo" }).sort({ nombre: 1 });
    res.json(transportistas);
  } catch (error) {
    console.error('Error listando transportistas activos:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar un transportista
export const actualizarTransportista = async (req, res) => {
  try {
    const transportista = await Transportista.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!transportista) {
      return res.status(404).json({ message: "Transportista no encontrado" });
    }
    res.json(transportista);
  } catch (error) {
    console.error('Error actualizando transportista:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(400).json({ error: error.message });
  }
};

// Eliminar un transportista (desactivar)
export const eliminarTransportista = async (req, res) => {
  try {
    const transportista = await Transportista.findByIdAndUpdate(
      req.params.id,
      { estado: "Inactivo" },
      { new: true }
    );
    if (!transportista) {
      return res.status(404).json({ message: "Transportista no encontrado" });
    }
    res.json({ message: "Transportista desactivado exitosamente" });
  } catch (error) {
    console.error('Error eliminando transportista:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener estadísticas de transportistas
export const obtenerEstadisticasTransportistas = async (req, res) => {
  try {
    const totalTransportistas = await Transportista.countDocuments();
    const transportistasActivos = await Transportista.countDocuments({ estado: "Activo" });
    const transportistasInactivos = await Transportista.countDocuments({ estado: "Inactivo" });

    // Agrupar por tipo
    const porTipo = await Transportista.aggregate([
      { $group: { _id: "$tipo", count: { $sum: 1 } } }
    ]);

    // Promedio de rating
    const promedioRating = await Transportista.aggregate([
      { $match: { rating: { $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } }
    ]);

    const estadisticas = {
      total: totalTransportistas,
      activos: transportistasActivos,
      inactivos: transportistasInactivos,
      porTipo: porTipo.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      promedioRating: promedioRating.length > 0 ? promedioRating[0].avgRating.toFixed(1) : 0
    };

    res.json(estadisticas);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
};
