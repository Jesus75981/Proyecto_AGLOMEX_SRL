import Venta from "../models/venta.js";

export const registrarVenta = async (req, res) => {
  const venta = new Venta(req.body);
  await venta.save();
  res.status(201).json(venta);
};

export const listarVentas = async (req, res) => {
  const ventas = await Venta.find().populate("cliente productos.producto");
  res.json(ventas);
};
