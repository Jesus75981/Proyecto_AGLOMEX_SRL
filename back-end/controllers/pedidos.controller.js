import Pedido from "../models/pedido.model.js";

export const crearPedido = async (req, res) => {
  const pedido = new Pedido(req.body);
  await pedido.save();
  res.status(201).json(pedido);
};

export const listarPedidos = async (req, res) => {
  const pedidos = await Pedido.find().populate("cliente productos.producto");
  res.json(pedidos);
};

export const actualizarEstadoPedido = async (req, res) => {
  const pedido = await Pedido.findByIdAndUpdate(req.params.id, { estado: req.body.estado }, { new: true });
  res.json(pedido);
};
