// controllers/logistica.controller.js
import Logistica from "../models/logistica.model.js";  // ✅ Usar Logistica (no Pedido)
import Contador from "../models/contador.model.js";
import ProductoTienda from "../models/productoTienda.model.js";

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
    const pedidoData = req.body;

    // 1. VALIDACIÓN DE STOCK: Verificar que hay suficiente stock para todos los productos del pedido
    const productosInsuficientes = [];
    for (const item of pedidoData.productos) {
      const producto = await ProductoTienda.findById(item.producto);

      if (!producto) {
        return res.status(404).json({
          error: `Producto con ID ${item.producto} no encontrado.`
        });
      }

      if (producto.cantidad < item.cantidad) {
        productosInsuficientes.push({
          nombre: producto.nombre,
          stockActual: producto.cantidad,
          solicitado: item.cantidad
        });
      }
    }

    // Si hay productos con stock insuficiente, rechazar el pedido
    if (productosInsuficientes.length > 0) {
      return res.status(400).json({
        error: "Stock insuficiente para crear el pedido de logística:",
        productosInsuficientes,
        sugerencia: "Reduzca las cantidades o espere a que llegue más inventario antes de crear el pedido."
      });
    }

    const pedidoNumero = await getNextSequenceValue('pedidoNumero');

    // 2. Transformar datos para que coincidan con el modelo
    const pedidoFinal = {
      ...pedidoData,
      pedidoNumero,
      fechaEntrega: new Date(pedidoData.fechaEntrega) // Convertir string a Date
    };

    const pedido = new Logistica(pedidoFinal);
    await pedido.save();

    // 3. Devolver datos poblados para el frontend
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

// Actualizar tiempo estimado de entrega
export const actualizarTiempoEstimado = async (req, res) => {
  try {
    const { tiempoEstimado, razon } = req.body;
    const pedido = await Logistica.findByIdAndUpdate(
      req.params.id,
      {
        tiempoEstimado,
        ultimaActualizacion: new Date(),
        observaciones: razon ? `Tiempo actualizado: ${razon}` : undefined
      },
      { new: true }
    ).populate("cliente")
     .populate("productos.producto");

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    res.json(pedido);
  } catch (error) {
    console.error('Error actualizando tiempo estimado:', error);
    res.status(400).json({ error: error.message });
  }
};

// Notificar retraso en envío
export const notificarRetraso = async (req, res) => {
  try {
    const { nuevoTiempoEstimado, razonRetraso } = req.body;
    const pedido = await Logistica.findByIdAndUpdate(
      req.params.id,
      {
        tiempoEstimado: nuevoTiempoEstimado,
        estado: 'retrasado',
        observaciones: `RETRASO: ${razonRetraso}`,
        ultimaActualizacion: new Date()
      },
      { new: true }
    ).populate("cliente")
     .populate("productos.producto");

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // TODO: Implementar notificación al cliente (email/SMS)
    console.log(`Notificación de retraso enviada para pedido ${pedido.pedidoNumero}`);

    res.json({
      message: "Retraso notificado exitosamente",
      pedido
    });
  } catch (error) {
    console.error('Error notificando retraso:', error);
    res.status(400).json({ error: error.message });
  }
};

// Obtener estadísticas de logística
export const obtenerEstadisticas = async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query;

    // Calcular fechas según período
    const ahora = new Date();
    let fechaInicio;
    switch (periodo) {
      case 'semana':
        fechaInicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'mes':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        break;
      case 'trimestre':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth() - 2, 1);
        break;
      default:
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    }

    const pedidos = await Logistica.find({
      fechaPedido: { $gte: fechaInicio }
    });

    const estadisticas = {
      periodo,
      fechaInicio,
      fechaFin: ahora,
      totalPedidos: pedidos.length,
      pedidosPorEstado: {
        pendiente: pedidos.filter(p => p.estado === 'pendiente').length,
        en_proceso: pedidos.filter(p => p.estado === 'en_proceso').length,
        despachado: pedidos.filter(p => p.estado === 'despachado').length,
        entregado: pedidos.filter(p => p.estado === 'entregado').length,
        cancelado: pedidos.filter(p => p.estado === 'cancelado').length,
        retrasado: pedidos.filter(p => p.estado === 'retrasado').length
      },
      costoTotalEnvios: pedidos.reduce((sum, p) => sum + (p.costoAdicional || 0), 0),
      tiempoPromedioEntrega: calcularTiempoPromedio(pedidos),
      tasaEntregaExitosa: pedidos.length > 0 ?
        (pedidos.filter(p => p.estado === 'entregado').length / pedidos.length) * 100 : 0
    };

    res.json(estadisticas);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ error: error.message });
  }
};

// Función auxiliar para calcular tiempo promedio de entrega
const calcularTiempoPromedio = (pedidos) => {
  const pedidosEntregados = pedidos.filter(p =>
    p.estado === 'entregado' && p.fechaEntrega && p.fechaPedido
  );

  if (pedidosEntregados.length === 0) return 0;

  const tiempos = pedidosEntregados.map(p => {
    const tiempoEntrega = new Date(p.fechaEntrega) - new Date(p.fechaPedido);
    return tiempoEntrega / (1000 * 60 * 60 * 24); // días
  });

  return tiempos.reduce((sum, tiempo) => sum + tiempo, 0) / tiempos.length;
};
