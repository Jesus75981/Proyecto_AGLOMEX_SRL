import Proveedor from "../models/proveedores.model.js";

export const crearProveedor = async (req, res) => {
  try {
    const proveedor = new Proveedor(req.body);
    await proveedor.save();
    res.status(201).json(proveedor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const listarProveedores = async (req, res) => {
  const proveedores = await Proveedor.find();
  res.json(proveedores);
};

export const actualizarProveedor = async (req, res) => {
  const proveedor = await Proveedor.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(proveedor);
};

export const eliminarProveedor = async (req, res) => {
  await Proveedor.findByIdAndDelete(req.params.id);
  res.json({ message: "Proveedor eliminado" });
};
