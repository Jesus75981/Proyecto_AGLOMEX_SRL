import Categoria from "../models/categoria.model.js";

export const getCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.find().sort({ nombre: 1 });
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createCategoria = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ message: "El nombre es requerido" });

        const existingCategoria = await Categoria.findOne({ nombre });
        if (existingCategoria) {
            return res.status(400).json({ message: "La categoría ya existe" });
        }

        const newCategoria = new Categoria({ nombre });
        await newCategoria.save();
        res.status(201).json(newCategoria);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
