import Cliente from "../models/cliente.model.js";

export const crearCliente = async (req, res) => {
  try {
    const cliente = new Cliente(req.body);
    await cliente.save();
    res.status(201).json(cliente);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const listarClientes = async (req, res) => {
  const clientes = await Cliente.find();
  res.json(clientes);
};

export const actualizarCliente = async (req, res) => {
  const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(cliente);
};

export const eliminarCliente = async (req, res) => {
  await Cliente.findByIdAndDelete(req.params.id);
  res.json({ message: "Cliente eliminado" });
};