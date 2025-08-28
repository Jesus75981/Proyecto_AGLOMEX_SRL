import Compra from "../models/compra.js";

export const registrarCompra = async (req, res) => {
  const compra = new Compra(req.body);
  await compra.save();
  res.status(201).json(compra);
};

export const listarCompras = async (req, res) => {
  const compras = await Compra.find().populate("proveedor productos.producto");
  res.json(compras);
};
