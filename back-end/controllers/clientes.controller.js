import Cliente from "../models/cliente.model.js";

export const crearCliente = async (req, res) => {
  try {
    // Validación adicional en el controlador
    const { nombre, direccion, telefono } = req.body;

    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({ error: "Cliente validation failed: nombre: Path `nombre` is required." });
    }

    if (!direccion || direccion.trim().length === 0) {
      return res.status(400).json({ error: "Cliente validation failed: direccion: Path `direccion` is required." });
    }

    if (!telefono || telefono.trim().length === 0) {
      return res.status(400).json({ error: "Cliente validation failed: telefono: Path `telefono` is required." });
    }

    const cliente = new Cliente(req.body);
    await cliente.save();
    res.status(201).json(cliente);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ error: `Ya existe un cliente con este ${field} (${err.keyValue[field]}).` });
    }
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
  try {
    const cliente = await Cliente.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cliente) return res.status(404).json({ error: "Cliente no encontrado" });
    res.json(cliente);
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `Ya existe un cliente con este ${field} (${error.keyValue[field]}).` });
    }
    res.status(400).json({ error: error.message });
  }
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