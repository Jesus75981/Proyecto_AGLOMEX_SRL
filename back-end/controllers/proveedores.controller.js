import Proveedor from "../models/proveedores.model.js";

export const crearProveedor = async (req, res) => {
  try {
    const proveedor = new Proveedor(req.body);
    await proveedor.save();
    res.status(201).json(proveedor);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ error: `Ya existe un proveedor con este ${field} (${err.keyValue[field]}).` });
    }
    res.status(400).json({ error: err.message });
  }
};

export const listarProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.find({ activo: true });
    res.json(proveedores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizarProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!proveedor) return res.status(404).json({ error: "Proveedor no encontrado" });
    res.json(proveedor);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `Ya existe un proveedor con este ${field} (${error.keyValue[field]}).` });
    }
    res.status(400).json({ error: error.message });
  }
};

export const eliminarProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!proveedor) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json({ message: "Proveedor desactivado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
