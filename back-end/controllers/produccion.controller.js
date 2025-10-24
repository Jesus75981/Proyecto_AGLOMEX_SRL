import Produccion from "../models/produccion.model.js";
import ProductoTienda from "../models/productoTienda.model.js";
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

// Función para generar código interno
const generarCodigoInterno = (nombre) => {
  const timestamp = Date.now();
  const nombreLimpio = nombre.replace(/\s+/g, '').toUpperCase();
  return `PROD-${nombreLimpio}-${timestamp}`;
};

export const crearProduccion = async (req, res) => {
  try {
    const produccion = new Produccion(req.body);
    await produccion.save();
    res.status(201).json(produccion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const listarProducciones = async (req, res) => {
  try {
    const producciones = await Produccion.find().populate("materiales.material productoFinal");
    res.json(producciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Función para iniciar producción automática
export const iniciarProduccion = async (req, res) => {
  try {
    const produccion = await Produccion.findById(req.params.id);
    if (!produccion) {
      return res.status(404).json({ message: "Registro de producción no encontrado" });
    }

    if (produccion.estado !== 'Pendiente') {
      return res.status(400).json({ message: "La producción ya ha sido iniciada" });
    }

    produccion.fechaInicio = new Date();
    produccion.estado = 'En Progreso';
    produccion.progreso = 0;
    produccion.tiempoTranscurrido = 0;

    await produccion.save();

    res.json({ message: "Producción iniciada automáticamente", produccion });
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

    console.log(`✅ Progreso actualizado para ${produccionesEnProgreso.length} producciones`);
  } catch (error) {
    console.error('❌ Error actualizando progreso automático:', error);
  }
};

// Función para completar producción automáticamente
const completarProduccionAutomatica = async (produccion) => {
  try {
    const idProductoTienda = generarCodigoInterno(produccion.nombre);
    const nuevoProducto = new ProductoTienda({
      idProductoTienda: idProductoTienda,
      nombre: produccion.nombre,
      descripcion: `Producto fabricado automáticamente - ${produccion.nombre}`,
      cantidad: produccion.cantidad,
      precioCompra: produccion.precioCompra,
      precioVenta: produccion.precioVenta,
      imagen: produccion.imagen,
    });

    await nuevoProducto.save();

    produccion.productoFinal = nuevoProducto._id;
    await produccion.save();

    // Crear registro de logística para el traslado interno
    const pedidoNumero = await getNextSequenceValue('pedidoNumero');
    const trasladoLogistico = new Logistica({
        pedidoNumero: pedidoNumero,
        productos: [{
            producto: nuevoProducto._id,
            cantidad: nuevoProducto.cantidad,
            precioUnitario: nuevoProducto.precioVenta,
            precioTotal: nuevoProducto.precioVenta * nuevoProducto.cantidad
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

export const confirmarProduccion = async (req, res) => {
  try {
    const produccion = await Produccion.findById(req.params.id);
    if (!produccion) {
      return res.status(404).json({ message: "Registro de producción no encontrado" });
    }

    if (produccion.estado !== 'Completado') {
      return res.status(400).json({ message: "La producción debe estar completada para confirmar" });
    }

    // La producción ya está completada automáticamente, solo confirmar
    res.json({ message: "Producción confirmada", produccion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
