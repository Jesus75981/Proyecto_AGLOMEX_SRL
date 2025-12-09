import Pedido from "../models/pedido.model.js";
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

// Importación adicional necesaria para el fallback
import Venta from "../models/venta.model.js";

export const obtenerPedidoPorNumero = async (req, res) => {
  try {
    const { numero } = req.params;

    // 1. Normalización de entrada (Soporte para TRK-1234, #1234, etc.)
    let numeroLimpio = numero.replace(/\D/g, ''); // Extraer solo números
    const numeroParsed = parseInt(numeroLimpio);

    if (isNaN(numeroParsed)) {
      return res.status(400).json({ message: "Número de pedido inválido. Ingrese el código numérico (ej: 1001)." });
    }

    // 2. Estrategia de Búsqueda Priorizada

    // A. Buscar en Colección PEDIDOS (Pedidos personalizados)
    const pedido = await Pedido.findOne({ pedidoNumero: numeroParsed }).populate("cliente productos.producto");

    if (pedido) {
      const logistica = await Logistica.findOne({ pedidoNumero: numeroParsed }).populate("transportista"); // Usar pedidoNumero común
      return res.json({ pedido, logistica });
    }

    // B. Fallback: Buscar en LOGISTICA (Envíos de Ventas)
    // Si no existe 'Pedido', es probable que sea una 'Venta' con envío.
    const logistica = await Logistica.findOne({ pedidoNumero: numeroParsed })
      .populate("cliente")
      .populate("productos.producto")
      .populate("transportista");

    if (logistica) {
      // Intentar recuperar datos extra de la Venta
      const venta = await Venta.findOne({ numVenta: numeroParsed }).populate("cliente");

      // Construir objeto "fake" de pedido para compatibilidad con frontend
      const pedidoSimulado = {
        pedidoNumero: logistica.pedidoNumero,
        estado: logistica.estado === 'despachado' ? 'despachado' : (logistica.estado === 'entregado' ? 'entregado' : 'en_produccion'),
        fechaPedido: logistica.fechaPedido,
        fechaEntrega: logistica.fechaEntrega,
        cliente: logistica.cliente,
        productos: logistica.productos,
        tipo: "Venta Directa"
      };

      return res.json({ pedido: pedidoSimulado, logistica });
    }

    // C. Fallback: Buscar en VENTAS (Venta sin envío aun o retirado)
    const venta = await Venta.findOne({ numVenta: numeroParsed }).populate("cliente productos.producto");

    if (venta) {
      // Si es venta, adaptamos la respuesta
      const pedidoSimulado = {
        pedidoNumero: venta.numVenta,
        estado: 'pendiente', // Asumir pendiente si no hay logistica
        fechaPedido: venta.fecha,
        fechaEntrega: null, // No hay fecha definida
        cliente: venta.cliente,
        productos: venta.productos.map(p => ({
          producto: p.producto,
          cantidad: p.cantidad
        })),
        tipo: "Venta Tienda"
      };
      // Retornar logistica null
      return res.json({ pedido: pedidoSimulado, logistica: null });
    }

    return res.status(404).json({ message: `No se encontró el pedido #${numeroParsed}. Verifique el número.` });

  } catch (error) {
    console.error(error);
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

    // Buscar pedido por pedidoNumero
    const pedido = await Pedido.findOne({ pedidoNumero: numero }).populate("cliente productos.producto");

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // Usar datos del cliente si no se proporcionan en el body
    const nombreFinal = nombre || (pedido.cliente ? pedido.cliente.nombre : "Cliente");
    const telefonoFinal = telefono || (pedido.cliente ? pedido.cliente.telefono : "");
    const ciudadFinal = ciudad || (pedido.cliente ? pedido.cliente.ubicacion : "Bolivia");

    // Verificar fecha de entrega
    const fechaActual = new Date();
    if (pedido.fechaEntrega && pedido.fechaEntrega > fechaActual) {
      return res.status(400).json({ message: "La fecha de entrega aún no ha llegado" });
    }

    // Buscar logística asociada
    const logistica = await Logistica.findOne({ pedido: pedido._id }).populate("transportista ruta");

    if (!logistica) {
      return res.status(404).json({ message: "No se encontró logística para este pedido" });
    }

    // Verificar que la logística esté en estado 'entregado'
    if (logistica.estado !== 'entregado') {
      return res.status(400).json({ message: "El pedido no ha sido marcado como entregado en logística" });
    }

    // Actualizar estado del pedido a 'entregado'
    pedido.estado = 'entregado';
    await pedido.save();

    // Obtener historial de logística (todas las logisticas del pedido, aunque debería ser una)
    const historialLogistica = await Logistica.find({ pedido: pedido._id }).populate("transportista ruta").sort({ createdAt: -1 });

    // Aquí se podrían almacenar los datos adicionales en un log o tabla separada si es necesario
    console.log(`Recepción confirmada para pedido ${numero} por ${nombreFinal} (${telefonoFinal}) de ${ciudadFinal}`);

    // Enviar WhatsApp de confirmación
    const whatsappMessage = `¡Hola ${nombreFinal}! Tu pedido #${numero} ha sido confirmado como recibido exitosamente. Gracias por tu compra en Aglomex SRL. 📦✅`;
    const whatsappUrl = `https://wa.me/591${telefonoFinal}?text=${encodeURIComponent(whatsappMessage)}`;

    // Log del WhatsApp (en producción se enviaría automáticamente)
    console.log(`WhatsApp enviado a ${telefonoFinal}: ${whatsappMessage}`);
    console.log(`URL WhatsApp: ${whatsappUrl}`);

    res.json({
      message: "Recepción confirmada exitosamente",
      pedido,
      logistica,
      historialLogistica,
      whatsapp: {
        numero: "72876225",
        mensaje: whatsappMessage,
        url: whatsappUrl
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error al confirmar recepción", error: error.message });
  }
};
