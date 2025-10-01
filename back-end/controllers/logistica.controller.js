// controllers/logistica.controller.js
import Logistica from "../models/logistica.model.js";  // ✅ Usar Logistica (no Pedido)
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
    
    // ✅ AGREGAR: Transformar datos para que coincidan con el modelo
    const pedidoData = {
      ...req.body,
      pedidoNumero,
      fechaEntrega: new Date(req.body.fechaEntrega) // Convertir string a Date
    };
    
    const pedido = new Logistica(pedidoData);
    await pedido.save();
    
    // ✅ POPULAR: Devolver datos poblados para el frontend
    const pedidoGuardado = await Logistica.findById(pedido._id)
      .populate("cliente")
      .populate("productos.producto");
      
    res.status(201).json(pedidoGuardado);
  } catch (error) {
    console.error('Error creando pedido:', error);
    res.status(400).json({ error: error.message });
  }
};

// Listar todos los pedidos de logística
export const listarPedidos = async (req, res) => {
  try {
    const pedidos = await Logistica.find()
      .populate("cliente")
      .populate("productos.producto")
      .sort({ fechaPedido: -1 });
    res.json(pedidos);
  } catch (error) {
    console.error('Error listando pedidos:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar el estado de un pedido
export const actualizarEstadoPedido = async (req, res) => {
  try {
    const pedido = await Logistica.findByIdAndUpdate(
      req.params.id,
      { estado: req.body.estado },
      { new: true }
    ).populate("cliente")
     .populate("productos.producto");
     
    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    res.json(pedido);
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(400).json({ error: error.message });
  }
};

// Eliminar un pedido de logística
export const eliminarPedido = async (req, res) => {
  try {
    const pedido = await Logistica.findByIdAndDelete(req.params.id);
    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    res.json({ message: "Pedido eliminado exitosamente" });
  } catch (error) {
    console.error('Error eliminando pedido:', error);
    res.status(500).json({ error: error.message });
  }
};