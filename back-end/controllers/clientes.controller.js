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
  try {
    const clientes = await Cliente.find({ activo: true });
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizarCliente = async (req, res) => {
  const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(cliente);
};

export const eliminarCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.json({ message: "Cliente desactivado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};