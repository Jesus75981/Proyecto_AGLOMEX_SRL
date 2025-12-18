import Logistica from "../models/logistica.model.js";  // ✅ Usar Logistica (no Pedido)
import Venta from "../models/venta.model.js"; // Import Venta model
import Contador from "../models/contador.model.js";
import ProductoTienda from "../models/productoTienda.model.js";
import Ruta from "../models/ruta.model.js";

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
    const { year, month, period, date } = req.query;

    // 1. Determinar el rango de fechas (Match Stage)
    let matchStage = {};
    const currentYear = year ? parseInt(year) : 2025;

    if (period === 'day' && date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
      matchStage = { fechaPedido: { $gte: startOfDay, $lte: endOfDay } };
    } else if (period === 'month' && month) {
      const startOfMonth = new Date(currentYear, parseInt(month) - 1, 1);
      const endOfMonth = new Date(currentYear, parseInt(month), 0, 23, 59, 59, 999);
      matchStage = { fechaPedido: { $gte: startOfMonth, $lte: endOfMonth } };
    } else if (period === 'week' && date) {
      // Semana que contiene la fecha
      const selectedDate = new Date(date);
      const dayOfWeek = selectedDate.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() + diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      matchStage = { fechaPedido: { $gte: startOfWeek, $lte: endOfWeek } };
    } else {
      // Por defecto anual (o year especificado)
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      matchStage = { fechaPedido: { $gte: startOfYear, $lte: endOfYear } };
    }

    const pedidos = await Logistica.find(matchStage);

    // Agregación para estadísticas mensuales (para gráficas)
    let groupBy = { month: { $month: "$fechaPedido" } }; // Default annual
    if (period === 'month') groupBy = { day: { $dayOfMonth: "$fechaPedido" } };
    if (period === 'day') groupBy = { hour: { $hour: "$fechaPedido" } };

    const pedidosGrafica = await Logistica.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          costoTotal: { $sum: "$costoEnvio" } // Changed from costoAdicional to costoEnvio
        }
      },
      {
        $project: {
          _id: 0,
          period: "$_id",
          count: 1,
          costoTotal: 1
        }
      },
      { $sort: { "period": 1 } }
    ]);

    // Agregación por Método de Entrega
    const pedidosPorMetodo = await Logistica.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$metodoEntrega", // Changed from empresaEnvio to metodoEntrega
          value: { $sum: 1 }
        }
      },
      {
        $project: {
          name: { $ifNull: ["$_id", "Desconocido"] },
          value: 1,
          _id: 0
        }
      }
    ]);

    const estadisticas = {
      filtros: { year: currentYear, period: period || 'year' },
      totalPedidos: pedidos.length,
      pedidosPorEstado: {
        pendiente: pedidos.filter(p => p.estado === 'pendiente').length,
        en_proceso: pedidos.filter(p => p.estado === 'en_proceso').length,
        despachado: pedidos.filter(p => p.estado === 'despachado').length,
        entregado: pedidos.filter(p => p.estado === 'entregado').length,
        cancelado: pedidos.filter(p => p.estado === 'cancelado').length,
        retrasado: pedidos.filter(p => p.estado === 'retrasado').length
      },
      pedidosPorMetodo: pedidosPorMetodo,
      costoTotalEnvios: pedidos.reduce((sum, p) => sum + (p.costoEnvio || 0), 0), // Changed to costoEnvio
      tiempoPromedioEntrega: calcularTiempoPromedio(pedidos),
      tasaEntregaExitosa: pedidos.length > 0 ?
        (pedidos.filter(p => p.estado === 'entregado').length / pedidos.length) * 100 : 0,
      pedidosGrafica,
      pedidosRecientes: pedidos.sort((a, b) => new Date(b.fechaPedido) - new Date(a.fechaPedido)).slice(0, 5)
    };

    res.json({ estadisticas });
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

// === FUNCIONES PARA RUTAS DE DISTRIBUCIÓN ===

// Obtener todas las rutas
export const getRutas = async (req, res) => {
  try {
    const rutas = await Ruta.find()
      .populate('transportista')
      .sort({ createdAt: -1 });
    res.json(rutas);
  } catch (error) {
    console.error('Error obteniendo rutas:', error);
    res.status(500).json({ error: error.message });
  }
};

// Crear una nueva ruta
export const createRuta = async (req, res) => {
  try {
    const rutaData = req.body;
    const ruta = new Ruta(rutaData);
    await ruta.save();

    const rutaGuardada = await Ruta.findById(ruta._id).populate('transportista');
    res.status(201).json(rutaGuardada);
  } catch (error) {
    console.error('Error creando ruta:', error);
    res.status(400).json({ error: error.message });
  }
};

// Actualizar una ruta
export const updateRuta = async (req, res) => {
  try {
    const ruta = await Ruta.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('transportista');

    if (!ruta) {
      return res.status(404).json({ message: "Ruta no encontrada" });
    }
    res.json(ruta);
  } catch (error) {
    console.error('Error actualizando ruta:', error);
    res.status(400).json({ error: error.message });
  }
};

// Eliminar una ruta
export const deleteRuta = async (req, res) => {
  try {
    const ruta = await Ruta.findByIdAndDelete(req.params.id);
    if (!ruta) {
      return res.status(404).json({ message: "Ruta no encontrada" });
    }
    res.json({ message: "Ruta eliminada exitosamente" });
  } catch (error) {
    console.error('Error eliminando ruta:', error);
    res.status(500).json({ error: error.message });
  }
};

// === FUNCIONES PARA INTEGRACIÓN CON LOGÍSTICA ===

// Obtener todas las rutas activas
export const getAll = async (req, res) => {
  try {
    const pedidos = await Logistica.find()
      .populate("cliente")
      .populate("productos.producto")
      .populate("transportista")
      .sort({ fechaPedido: -1 });
    res.json(pedidos);
  } catch (error) {
    console.error('Error listando pedidos:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener pedido por ID
export const getById = async (req, res) => {
  try {
    const pedido = await Logistica.findById(req.params.id)
      .populate("cliente")
      .populate("productos.producto")
      .populate("transportista");

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    res.json(pedido);
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({ error: error.message });
  }
};

// Crear pedido
export const create = async (req, res) => {
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
      .populate("productos.producto")
      .populate("transportista");

    res.status(201).json(pedidoGuardado);
  } catch (error) {
    console.error('Error creando pedido:', error);
    res.status(400).json({ error: error.message });
  }
};

// Actualizar pedido
export const update = async (req, res) => {
  try {
    const pedido = await Logistica.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("cliente")
      .populate("productos.producto")
      .populate("transportista");

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }
    res.json(pedido);
  } catch (error) {
    console.error('Error actualizando pedido:', error);
    res.status(400).json({ error: error.message });
  }
};

// Eliminar pedido
export const deletePedido = async (req, res) => {
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

// Obtener envíos activos
export const getEnviosActivos = async (req, res) => {
  try {
    const envios = await Logistica.find({
      estado: { $in: ['pendiente', 'en_proceso', 'despachado'] }
    })
      .populate("cliente")
      .populate("productos.producto")
      .populate("transportista")
      .sort({ fechaPedido: -1 });
    res.json(envios);
  } catch (error) {
    console.error('Error obteniendo envíos activos:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener ventas pendientes de envío (para integración automática)
export const getVentasPendientesEnvio = async (req, res) => {
  try {
    console.log("🔍 Buscando ventas pendientes de envío...");

    // 1. Obtener todas las ventas que requieren envío
    // Criterios:
    // - Metodo de entrega: Envio Domicilio OR Envio Nacional
    // - NO deben estar ya en la colección de Logística

    const ventasCandidatas = await Venta.find({
      metodoEntrega: { $in: ["Envio Domicilio", "Envio Nacional", "Recojo Tienda", "Recojo Almacen"] }
    }).populate('cliente productos.producto');

    console.log(`📋 Ventas candidatas encontradas: ${ventasCandidatas.length}`);

    // 2. Obtener los IDs de pedidos/ventas que YA existen en Logística
    const pedidosLogistica = await Logistica.find({}, 'pedidoNumero');
    const numerosPedidoExistentes = pedidosLogistica.map(p => p.pedidoNumero);

    console.log(`📦 Pedidos en logística existentes: ${numerosPedidoExistentes.length}`);

    // 3. Filtrar las ventas que NO están en logística
    const ventasPendientes = ventasCandidatas.filter(venta => {
      // Asumimos que numVenta es equivalente a pedidoNumero
      return !numerosPedidoExistentes.includes(venta.numVenta);
    });

    console.log(`✨ Ventas realmente pendientes: ${ventasPendientes.length}`);

    res.json(ventasPendientes);

  } catch (error) {
    console.error('Error obteniendo ventas pendientes:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar estado de envío
export const updateEstadoEnvio = async (req, res) => {
  try {
    const { estado } = req.body;
    const pedido = await Logistica.findByIdAndUpdate(
      req.params.id,
      {
        estado,
        ultimaActualizacion: new Date()
      },
      { new: true }
    ).populate("cliente")
      .populate("productos.producto")
      .populate("transportista");

    if (!pedido) {
      return res.status(404).json({ message: "Envío no encontrado" });
    }
    res.json(pedido);
  } catch (error) {
    console.error('Error actualizando estado de envío:', error);
    res.status(400).json({ error: error.message });
  }
};
