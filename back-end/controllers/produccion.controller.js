import Produccion from "../../src/models/produccion.models.js";

export const crearProduccion = async (req, res) => {
  const produccion = new Produccion(req.body);
  await produccion.save();
  res.status(201).json(produccion);
};

export const listarProducciones = async (req, res) => {
  const producciones = await Produccion.find().populate("materiales.material productoFinal");
  res.json(producciones);
};

export const confirmarProduccion = async (req, res) => {
  const produccion = await Produccion.findByIdAndUpdate(req.params.id, { estado: "Confirmado" }, { new: true });
  res.json(produccion);
};
