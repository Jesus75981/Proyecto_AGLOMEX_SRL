// controllers/logistica.controller.js
import Logistica from "../models/logistica.model.js";
import Contador from "../models/contador.model.js";

// Función auxiliar para obtener el siguiente valor de la secuencia del contador
const getNextSequenceValue = async (nombreSecuencia) => {
  const secuencia = await Contador.findOneAndUpdate(
    { nombre: nombreSecuencia },
    { $inc: { valor: 1 } },
    { new: true, upsert: true }
  );
  return secuencia.valor;
};

// Crear un nuevo pedido de logística
export const crearPedido = async (req, res) => {
  try {
    const pedidoNumero = await getNextSequenceValue('pedidoNumero');
    const pedido = new Logistica({ ...req.body, pedidoNumero });
    await pedido.save();
    res.status(201).json(pedido);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Listar todos los pedidos de logística
export const listarPedidos = async (req, res) => {
  try {
    const pedidos = await Logistica.find()
      .populate("cliente productos.producto")
      .sort({ fechaPedido: -1 }); // Opcional: ordenar por fecha
    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar el estado de un pedido (por ejemplo, "En Proceso" a "Despachado")
export const actualizarEstadoPedido = async (req, res) => {
  try {
    const pedido = await Logistica.findByIdAndUpdate(
      req.params.id,
      { estado: req.body.estado },
      { new: true } // Devuelve el documento actualizado
    );
    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    res.json(pedido);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar un pedido de logística (borrado físico, ya que son registros de eventos)
export const eliminarPedido = async (req, res) => {
  try {
    const pedido = await Logistica.findByIdAndDelete(req.params.id);
    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    res.json({ message: "Pedido eliminado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};