import Produccion from "../models/produccion.model.js";
import ProductoTienda from "../models/productoTienda.model.js";
import MateriaPrima from "../models/materiaPrima.model.js";
import Logistica from "../models/logistica.model.js";
import Contador from "../models/contador.model.js";
import Objeto3D from "../models/objetos3d.model.js";
import * as tripoService from "../services/tripo.service.js";

// Función auxiliar para obtener el siguiente valor de la secuencia del contador
const getNextSequenceValue = async (nombreSecuencia) => {
  const secuencia = await Contador.findOneAndUpdate(
    { nombre: nombreSecuencia },
    { $inc: { valor: 1 } },
    { new: true, upsert: true }
  );
  return secuencia.valor;
};

// Función para generar código interno (Secuencial)
const generarCodigoInterno = async (nombre) => {
  const secuencia = await getNextSequenceValue('productoCodigo');
  const nombreLimpio = nombre ? nombre.substring(0, 3).toUpperCase() : 'PRO';
  return `${nombreLimpio}-${String(secuencia).padStart(4, '0')}`;
};

export const crearProduccion = async (req, res) => {
  try {
    console.log('Creating Production Payload:', JSON.stringify(req.body));

    // 1. Validar stock de materiales
    if (req.body.materiales && req.body.materiales.length > 0) {
      try {
        for (const item of req.body.materiales) {
          if (!item.material) continue; // Skip invalid items

          const materialId = item.material._id || item.material;
          const material = await MateriaPrima.findById(materialId);

          if (!material) {
            console.error(`Material not found: ${materialId}`);
            return res.status(400).json({ message: `Material no encontrado con ID: ${materialId}` });
          }

          if (material.cantidad < item.cantidad) {
            console.error(`Insufficient stock for ${material.nombre}: Has ${material.cantidad}, Need ${item.cantidad}`);
            return res.status(400).json({
              message: `Stock insuficiente para: ${material.nombre}. Disponible: ${material.cantidad}, Requerido: ${item.cantidad}`
            });
          }
        }
      } catch (validationError) {
        console.error('Error during material validation:', validationError);
        return res.status(500).json({
          error: 'Error validando materiales',
          details: validationError.message
        });
      }
    }

    // 2. Crear y Guardar Producción
    try {
      // Clean payload if necessary? Mongoose handles it.
      // Generate unique order number
      const numeroOrden = await getNextSequenceValue('produccionNumero');

      // Generate optimized short correlative code
      // Format: AAA-0000 (Category Prefix - Sequence Number)
      const prefix = req.body.categoria
        ? req.body.categoria.substring(0, 3).toUpperCase()
        : 'PRO';
      const codigoCorrelativo = `${prefix}-${String(numeroOrden).padStart(4, '0')}`;

      const produccion = new Produccion({
        ...req.body,
        numeroOrden,
        idProduccion: codigoCorrelativo, // Override timestamp-based ID
        categoria: req.body.categoria,
        marca: req.body.marca
      });
      await produccion.save();
      console.log('Production created successfully:', produccion._id);
      res.status(201).json(produccion);
    } catch (saveError) {
      if (saveError.code === 11000) {
        return res.status(400).json({ error: "Ya existe una orden de producción con estos datos únicos." });
      }
      console.error('Error saving production to DB:', saveError);
      return res.status(500).json({
        error: 'Error guardando orden de producción',
        details: saveError.message,
        // stack: saveError.stack // Optional: hide stack in production usually, but good for debug
      });
    }

  } catch (error) {
    console.error('Unexpected error in crearProduccion:', error);
    res.status(500).json({
      error: 'Error inesperado al crear producción',
      details: error.message
    });
  }
};

export const listarProducciones = async (req, res) => {
  try {
    const producciones = await Produccion.find()
      .populate({
        path: 'materiales.material',
        populate: { path: 'proveedor' }
      })
      .populate("productoFinal")
      .sort({ createdAt: -1 }); // Sort by newest first usually better
    res.json(producciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Función para iniciar producción automática
export const iniciarProduccion = async (req, res) => {
  try {
    const produccion = await Produccion.findById(req.params.id).populate('materiales.material');
    if (!produccion) {
      return res.status(404).json({ message: "Registro de producción no encontrado" });
    }

    if (produccion.estado !== 'Pendiente') {
      return res.status(400).json({ message: "La producción ya ha sido iniciada" });
    }

    // Verificar y descontar stock de materiales
    for (const item of produccion.materiales) {
      const material = await MateriaPrima.findById(item.material._id);
      if (!material) {
        return res.status(400).json({ message: `Material no encontrado: ${item.material.nombre}` });
      }
      if (material.cantidad < item.cantidad) {
        return res.status(400).json({ message: `Stock insuficiente para: ${material.nombre}` });
      }
      material.cantidad -= item.cantidad;
      await material.save();
    }

    produccion.fechaInicio = new Date();
    produccion.estado = 'En Progreso';
    produccion.progreso = 0;
    produccion.tiempoTranscurrido = 0;

    await produccion.save();

    // 🔔 Send WhatsApp Notification
    if (process.env.OWNER_PHONE_NUMBER) {
      import('../services/whatsapp.service.js').then(module => {
        const whatsappService = module.default;
        const msg = `🔔 *Producción Iniciada*\n\n📋 *Producto:* ${produccion.nombre}\n🔢 *Cantidad:* ${produccion.cantidad}\n📅 *Inicio:* ${new Date().toLocaleString()}\n⏳ *Estimado:* ${produccion.tiempoEstimado} días`;
        whatsappService.sendMessage(process.env.OWNER_PHONE_NUMBER, msg);
      });
    }

    res.json({ message: "Producción iniciada y materiales descontados", produccion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Función para actualizar progreso automático
export const actualizarProgresoAutomatico = async () => {
  try {
    const produccionesEnProgreso = await Produccion.find({
      estado: 'En Progreso',
      fechaInicio: { $ne: null }
    });

    for (const produccion of produccionesEnProgreso) {
      const ahora = new Date();
      const tiempoTranscurrido = (ahora - produccion.fechaInicio) / (1000 * 60 * 60); // en horas
      const progresoCalculado = Math.min(100, (tiempoTranscurrido / produccion.tiempoEstimado) * 100);

      produccion.progreso = Math.round(progresoCalculado);
      produccion.tiempoTranscurrido = tiempoTranscurrido;

      // Si el progreso llega al 100%, completar automáticamente
      if (progresoCalculado >= 100) {
        produccion.estado = 'Completado';
        produccion.progreso = 100;

        // Crear producto en tienda automáticamente
        await completarProduccionAutomatica(produccion);
      }

      await produccion.save();
    }

    // console.log(`✅ Progreso actualizado para ${produccionesEnProgreso.length} producciones`);
  } catch (error) {
    console.error('❌ Error actualizando progreso automático:', error);
  }
};

// Función para completar producción automáticamente
const completarProduccionAutomatica = async (produccion, datosExtra = {}) => {
  try {
    // Buscar si ya existe un producto con el mismo nombre
    let productoFinal = await ProductoTienda.findOne({ nombre: produccion.nombre });

    if (productoFinal) {
      // Si existe, actualizamos el stock y el precio si es necesario
      productoFinal.cantidad += produccion.cantidad;
      // Opcional: Actualizar precio de costo promedio ponderado si se desea
      await productoFinal.save();
    } else {
      // Si no existe, lo creamos
      const idProductoTienda = await generarCodigoInterno(produccion.nombre);
      productoFinal = new ProductoTienda({
        idProductoTienda: idProductoTienda,
        nombre: produccion.nombre,
        descripcion: datosExtra.descripcion || `Producto fabricado automáticamente - ${produccion.nombre}`,
        cantidad: produccion.cantidad,
        precioCompra: produccion.precioCompra,
        precioVenta: datosExtra.precioVenta || produccion.precioVenta,
        imagen: produccion.imagen || datosExtra.imagen || "",
        tipo: 'Producto Terminado',
        categoria: datosExtra.categoria || 'Muebles',
        color: datosExtra.color || 'Estándar',
        codigo: idProductoTienda
      });
      await productoFinal.save();

      // [New] Trigger 3D generation if image is present (Automatic Creation)
      if (productoFinal.imagen) {
        const simulUrl = productoFinal.imagen.startsWith('http')
          ? productoFinal.imagen
          : `http://localhost:5000${productoFinal.imagen}`;

        (async () => {
          try {
            console.log(`[TRIPO] Iniciando generación 3D (Automatic) para producto ${productoFinal.nombre}...`);
            const taskId = await tripoService.create3DTask(simulUrl);

            const nuevoObjeto3D = new Objeto3D({
              producto: productoFinal._id,
              sourceImage: productoFinal.imagen,
              tripoTaskId: taskId,
              status: 'queued'
            });
            await nuevoObjeto3D.save();

            productoFinal.objeto3D = nuevoObjeto3D._id;
            await productoFinal.save();
            console.log(`[TRIPO] Tarea creada (Automatic): ${taskId}`);
          } catch (error) {
            console.error("[TRIPO] Error al iniciar generación (Automatic):", error.message);
          }
        })();
      }
    }

    produccion.productoFinal = productoFinal._id;
    await produccion.save();

    // Crear registro de logística para el traslado interno
    const pedidoNumero = await getNextSequenceValue('pedidoNumero');
    const trasladoLogistico = new Logistica({
      pedidoNumero: pedidoNumero,
      productos: [{
        producto: productoFinal._id,
        cantidad: produccion.cantidad,
        precioUnitario: productoFinal.precioVenta,
        precioTotal: productoFinal.precioVenta * produccion.cantidad
      }],
      tipoMovimiento: "Traslado Interno",
      direccionEntrega: "Almacén de la Tienda",
      metodoEntrega: "Recojo en Tienda",
      estado: "En Proceso",
    });
    await trasladoLogistico.save();

    console.log(`✅ Producción completada automáticamente: ${produccion.nombre}`);
  } catch (error) {
    console.error('❌ Error completando producción automáticamente:', error);
  }
};

// Función para verificar y enviar notificaciones de retraso
export const verificarRetrasos = async () => {
  try {
    const produccionesRetrasadas = await Produccion.find({
      estado: 'En Progreso',
      fechaInicio: { $ne: null },
      notificacionesEnviadas: false
    });

    for (const produccion of produccionesRetrasadas) {
      const ahora = new Date();
      const tiempoTranscurrido = (ahora - produccion.fechaInicio) / (1000 * 60 * 60); // en horas

      // Si lleva más del 150% del tiempo estimado
      if (tiempoTranscurrido > produccion.tiempoEstimado * 1.5) {
        produccion.estado = 'Retrasado';
        produccion.notificacionesEnviadas = true;
        await produccion.save();

        // Aquí se podría integrar un sistema de notificaciones (email, SMS, etc.)
        console.log(`🚨 ALERTA: Producción retrasada - ${produccion.nombre}`);
        console.log(`   Tiempo estimado: ${produccion.tiempoEstimado}h`);
        console.log(`   Tiempo transcurrido: ${tiempoTranscurrido.toFixed(1)}h`);
      }
    }
  } catch (error) {
    console.error('❌ Error verificando retrasos:', error);
  }
};

// Función para editar una orden de producción
export const actualizarProduccion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const produccion = await Produccion.findById(id).populate('materiales.material');
    if (!produccion) {
      return res.status(404).json({ message: "Orden de producción no encontrada" });
    }

    if (produccion.estado === 'Completado') {
      return res.status(400).json({ message: "No se puede editar una orden completada" });
    }

    // 1. Si está Pendiente, solo actualizamos los datos (no hay stock involucrado aún)
    if (produccion.estado === 'Pendiente') {
      const produccionActualizada = await Produccion.findByIdAndUpdate(id, updateData, { new: true });
      return res.json({ message: "Orden actualizada correctamente", produccion: produccionActualizada });
    }

    // 2. Si está En Progreso, debemos gestionar el inventario (diferencias)
    if (produccion.estado === 'En Progreso') {
      // Validar y calcular diferencias de materiales
      const nuevosMateriales = updateData.materiales || [];
      const viejosMateriales = produccion.materiales || [];

      // Mapa para facilitar búsqueda
      const mapViejos = {};
      viejosMateriales.forEach(m => {
        // m.material es un objeto populado, necesitamos su _id
        const matId = m.material._id ? m.material._id.toString() : m.material.toString();
        mapViejos[matId] = m.cantidad;
      });

      // Validar stock antes de aplicar cambios
      for (const nuevoMat of nuevosMateriales) {
        const matId = nuevoMat.material; // Asumimos que viene el ID
        const nuevaCant = nuevoMat.cantidad;
        const viejaCant = mapViejos[matId] || 0;
        const diferencia = nuevaCant - viejaCant;

        if (diferencia > 0) {
          // Necesitamos más material -> Validar stock
          const materialDb = await MateriaPrima.findById(matId);
          if (!materialDb) return res.status(400).json({ message: `Material no encontrado: ${matId}` });
          if (materialDb.cantidad < diferencia) {
            return res.status(400).json({
              message: `Stock insuficiente para actualización: ${materialDb.nombre}. Necesitas ${diferencia} más, tienes ${materialDb.cantidad}.`
            });
          }
        }
      }

      // Aplicar cambios de inventario
      // A) Procesar materiales en la nueva lista (Añadir/Aumentar o Disminuir/Devolver)
      for (const nuevoMat of nuevosMateriales) {
        const matId = nuevoMat.material;
        const nuevaCant = nuevoMat.cantidad;
        const viejaCant = mapViejos[matId] || 0;
        const diferencia = nuevaCant - viejaCant;

        if (diferencia !== 0) {
          const materialDb = await MateriaPrima.findById(matId);
          if (materialDb) {
            materialDb.cantidad -= diferencia; // Si dif > 0, resta. Si dif < 0, suma (devuelve).
            await materialDb.save();
          }
        }
        // Eliminar del mapa para saber cuáles sobran (fueron eliminados)
        delete mapViejos[matId];
      }

      // B) Procesar materiales que estaban antes pero ya no están (Devolver todo su stock)
      for (const [matId, cantDevolver] of Object.entries(mapViejos)) {
        const materialDb = await MateriaPrima.findById(matId);
        if (materialDb) {
          materialDb.cantidad += cantDevolver;
          await materialDb.save();
        }
      }

      // Actualizar la orden con los nuevos datos
      produccion.nombre = updateData.nombre || produccion.nombre;
      produccion.cantidad = updateData.cantidad || produccion.cantidad; // OJO: Si cambia cantidad output, no recalculamos materiales auto, usuario debe hacerlo.
      produccion.precioCompra = updateData.precioCompra || produccion.precioCompra;
      produccion.precioVenta = updateData.precioVenta || produccion.precioVenta;
      produccion.tiempoEstimado = updateData.tiempoEstimado || produccion.tiempoEstimado;
      produccion.imagen = updateData.imagen || produccion.imagen;
      produccion.materiales = nuevosMateriales;

      await produccion.save();
      return res.json({ message: "Orden en progreso actualizada e inventario ajustado", produccion });
    }

    res.status(400).json({ message: "Estado de orden no manejado para edición" });

  } catch (error) {
    console.error("Error actualizando producción:", error);
    res.status(500).json({ error: error.message });
  }
};

export const confirmarProduccion = async (req, res) => {
  try {
    const produccion = await Produccion.findById(req.params.id);
    if (!produccion) {
      return res.status(404).json({ message: "Registro de producción no encontrado" });
    }

    if (produccion.estado === 'Completado') {
      return res.status(400).json({ message: "La producción ya está completada" });
    }

    // Actualizar estado
    produccion.estado = 'Completado';
    produccion.progreso = 100;

    // Usar datos del body (modal frontend) si existen
    const datosExtra = req.body || {};

    await produccion.save();

    // Crear producto en tienda usando los datos extra
    await completarProduccionAutomatica(produccion, datosExtra);

    res.json({ message: "Producción confirmada y producto creado", produccion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Nueva función para obtener estadísticas de producción
export const getEstadisticasProduccion = async (req, res) => {
  try {
    const { year, month, period, date } = req.query;

    let matchCondition = {};
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    if (period === 'day' && date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));
      matchCondition.createdAt = { $gte: startOfDay, $lte: endOfDay };
    } else if (period === 'week' && date) {
      const selectedDate = new Date(date);
      const dayOfWeek = selectedDate.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() + diffToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      matchCondition.createdAt = { $gte: startOfWeek, $lte: endOfWeek };
    } else if (period === 'month' && month) {
      const selectedMonth = parseInt(month);
      const startDate = new Date(currentYear, selectedMonth - 1, 1);
      const endDate = new Date(currentYear, selectedMonth, 0, 23, 59, 59, 999);
      matchCondition.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    } else {
      // Annual (default)
      matchCondition.createdAt = {
        $gte: new Date(currentYear, 0, 1),
        $lte: new Date(currentYear, 11, 31, 23, 59, 59, 999)
      };
    }

    // Estadísticas generales de producción
    const estadisticasGenerales = await Produccion.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          totalProducciones: { $sum: 1 },
          produccionesCompletadas: {
            $sum: { $cond: [{ $eq: ["$estado", "Completado"] }, 1, 0] }
          },
          produccionesEnProgreso: {
            $sum: { $cond: [{ $eq: ["$estado", "En Progreso"] }, 1, 0] }
          },
          produccionesPendientes: {
            $sum: { $cond: [{ $eq: ["$estado", "Pendiente"] }, 1, 0] }
          },
          produccionesRetrasadas: {
            $sum: { $cond: [{ $eq: ["$estado", "Retrasado"] }, 1, 0] }
          },
          totalUnidadesProducidas: { $sum: "$cantidad" },
          tiempoPromedioEstimado: { $avg: "$tiempoEstimado" },
          tiempoPromedioReal: { $avg: "$tiempoTranscurrido" },
          progresoPromedio: { $avg: "$progreso" }
        }
      }
    ]);

    // Producción por mes
    const produccionMensual = await Produccion.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalProducciones: { $sum: 1 },
          unidadesProducidas: { $sum: "$cantidad" },
          tiempoTotalEstimado: { $sum: "$tiempoEstimado" },
          tiempoTotalReal: { $sum: "$tiempoTranscurrido" }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Producción por estado
    const produccionPorEstado = await Produccion.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$estado",
          count: { $sum: 1 },
          unidadesTotales: { $sum: "$cantidad" }
        }
      }
    ]);

    // Eficiencia por producción (completadas)
    const eficienciaProduccion = await Produccion.aggregate([
      {
        $match: {
          ...matchCondition,
          estado: "Completado",
          tiempoTranscurrido: { $gt: 0 }
        }
      },
      {
        $project: {
          nombre: 1,
          eficiencia: {
            $multiply: [
              { $divide: ["$tiempoEstimado", "$tiempoTranscurrido"] },
              100
            ]
          },
          tiempoEstimado: 1,
          tiempoTranscurrido: 1
        }
      },
      { $sort: { eficiencia: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        estadisticasGenerales: estadisticasGenerales[0] || {},
        produccionMensual,
        produccionPorEstado,
        eficienciaProduccion
      }
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de producción:", error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de producción',
      error: error.message
    });
  }
};
