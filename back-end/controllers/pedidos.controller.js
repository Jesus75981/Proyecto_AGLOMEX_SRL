import Pedido from "../models/pedido.model.js";
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

export const crearPedido = async (req, res) => {
  try {
    const pedidoNumero = await getNextSequenceValue('pedidoNumero');
    const pedidoData = {
      ...req.body,
      pedidoNumero
    };
    const pedido = new Pedido(pedidoData);
    await pedido.save();
    res.status(201).json(pedido);
  } catch (error) {
    console.error('Error creando pedido:', error);
    res.status(500).json({ error: error.message });
  }
};

export const listarPedidos = async (req, res) => {
  const pedidos = await Pedido.find().populate("cliente productos.producto");
  res.json(pedidos);
};

export const actualizarEstadoPedido = async (req, res) => {
  const pedido = await Pedido.findByIdAndUpdate(req.params.id, { estado: req.body.estado }, { new: true });
  res.json(pedido);
};

export const obtenerPedidoPorNumero = async (req, res) => {
  try {
    const { numero } = req.params;
    const numeroParsed = parseInt(numero);

    if (isNaN(numeroParsed)) {
      return res.status(400).json({ message: "Número de pedido inválido" });
    }

    const pedido = await Pedido.findOne({ pedidoNumero: numeroParsed }).populate("cliente productos.producto");
    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el pedido", error: error.message });
  }
};

export const confirmarRecepcionPedido = async (req, res) => {
  try {
    const { pedidoNumero, nombre, telefono, ciudad } = req.body;
    const numero = parseInt(pedidoNumero);

    if (isNaN(numero)) {
      return res.status(400).json({ message: "Número de pedido inválido" });
    }

    // Validar campos adicionales (opcional, solo para logging futuro)
    if (!nombre || !telefono || !ciudad) {
      return res.status(400).json({ message: "Todos los campos son requeridos" });
    }

    const pedido = await Pedido.findOneAndUpdate(
      { pedidoNumero: numero },
      { estado: "entregado" },
      { new: true }
    ).populate("cliente productos.producto");

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // Aquí se podrían almacenar los datos adicionales en un log o tabla separada si es necesario
    console.log(`Recepción confirmada para pedido ${numero} por ${nombre} (${telefono}) de ${ciudad}`);

    res.json({ message: "Recepción confirmada exitosamente", pedido });
  } catch (error) {
    res.status(500).json({ message: "Error al confirmar recepción", error: error.message });
  }
};
