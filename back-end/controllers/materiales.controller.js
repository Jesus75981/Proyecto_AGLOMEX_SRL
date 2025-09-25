import Material from "../../src/models/materiales.model.js";

export const crearMaterial = async (req, res) => {
  const material = new Material(req.body);
  await material.save();
  res.status(201).json(material);
};

export const listarMateriales = async (req, res) => {
  try {
    const materiales = await Material.find({ activo: true });
    res.json(materiales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizarMaterial = async (req, res) => {
  const material = await Material.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(material);
};

export const eliminarMaterial = async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!material) {
      return res.status(404).json({ message: "Material no encontrado" });
    }
    res.json({ message: "Material desactivado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
