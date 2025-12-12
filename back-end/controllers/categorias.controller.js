import Categoria from '../models/categoria.model.js';

// Obtener todas las categorías (público o privado según necesidad, aquí simple)
export const getCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.find({ activo: true });
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Crear categoría (por si se necesita en futuro)
// Crear categoría (o devolver existente)
export const createCategoria = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        // Verificar si existe (insensible a mayúsculas/minúsculas)
        const categoriaExistente = await Categoria.findOne({
            nombre: { $regex: new RegExp(`^${nombre}$`, 'i') }
        });

        if (categoriaExistente) {
            return res.status(200).json(categoriaExistente);
        }

        const nuevaCategoria = new Categoria({ nombre, descripcion });
        await nuevaCategoria.save();
        res.status(201).json(nuevaCategoria);
    } catch (error) {
        // Manejo específico para error de duplicado por si acaso
        if (error.code === 11000) {
            try {
                const existente = await Categoria.findOne({ nombre });
                if (existente) return res.status(200).json(existente);
            } catch (innerError) {
                return res.status(400).json({ message: error.message });
            }
        }
        res.status(400).json({ message: error.message });
    }
};
