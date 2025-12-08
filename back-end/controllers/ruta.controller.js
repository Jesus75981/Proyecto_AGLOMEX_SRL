import Ruta from "../models/ruta.model.js";

// Crear una nueva ruta
export const crearRuta = async (req, res) => {
    try {
        const ruta = new Ruta(req.body);
        await ruta.save();
        res.status(201).json(ruta);
    } catch (error) {
        console.error('Error creando ruta:', error);
        res.status(400).json({ error: error.message });
    }
};

// Listar todas las rutas
export const listarRutas = async (req, res) => {
    try {
        const rutas = await Ruta.find().populate('transportista', 'nombre');
        res.json(rutas);
    } catch (error) {
        console.error('Error listando rutas:', error);
        res.status(500).json({ error: error.message });
    }
};

// Eliminar una ruta
export const eliminarRuta = async (req, res) => {
    try {
        const ruta = await Ruta.findByIdAndDelete(req.params.id);
        if (!ruta) {
            return res.status(404).json({ message: "Ruta no encontrada" });
        }
        res.json({ message: "Ruta eliminada exitosamente" });
    } catch (error) {
        console.error('Error eliminando ruta:', error);
        res.status(500).json({ error: error.message });
    }
};
