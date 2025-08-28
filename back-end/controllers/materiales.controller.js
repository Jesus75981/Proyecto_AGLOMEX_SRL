import Material from "../../src/models/materiales.model.js";

export const crearMaterial = async (req, res) => {
  const material = new Material(req.body);
  await material.save();
  res.status(201).json(material);
};

export const listarMateriales = async (req, res) => {
  const materiales = await Material.find().populate("proveedor");
  res.json(materiales);
};

export const actualizarMaterial = async (req, res) => {
  const material = await Material.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(material);
};

export const eliminarMaterial = async (req, res) => {
  await Material.findByIdAndDelete(req.params.id);
  res.json({ message: "Material eliminado" });
};
