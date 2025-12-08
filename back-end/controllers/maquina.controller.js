import Maquina from "../models/maquina.model.js";

export const crearMaquina = async (req, res) => {
    try {
        const maquina = new Maquina(req.body);
        await maquina.save();
        res.status(201).json(maquina);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const listarMaquinas = async (req, res) => {
    try {
        const maquinas = await Maquina.find();
        res.json(maquinas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const actualizarMaquina = async (req, res) => {
    try {
        const maquina = await Maquina.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!maquina) return res.status(404).json({ message: "Máquina no encontrada" });
        res.json(maquina);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const eliminarMaquina = async (req, res) => {
    try {
        const maquina = await Maquina.findByIdAndDelete(req.params.id);
        if (!maquina) return res.status(404).json({ message: "Máquina no encontrada" });
        res.json({ message: "Máquina eliminada" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
