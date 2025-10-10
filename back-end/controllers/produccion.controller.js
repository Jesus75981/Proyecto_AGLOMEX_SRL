import Produccion from "../models/produccion.model.js";



export const crearProduccion = async (req, res) => {
  const produccion = new Produccion(req.body);
  await produccion.save();
  res.status(201).json(produccion);
};

export const listarProducciones = async (req, res) => {
  const producciones = await Produccion.find().populate("materiales.material productoFinal");
  res.json(producciones);
};

export const confirmarProduccion = async (req, res) => {
  try {
    const produccion = await Produccion.findById(req.params.id);
    if (!produccion) {
      return res.status(404).json({ message: "Registro de producción no encontrado" });
    }

    const idProductoTienda = generarCodigoInterno(produccion.nombre);
    const nuevoProducto = new ProductoTienda({
      idProductoTienda: idProductoTienda,
      nombre: produccion.nombre,
      descripcion: produccion.descripcion,
      cantidad: produccion.cantidad,
      precioCompra: produccion.precioCompra,
      precioVenta: produccion.precioVenta,
      imagen: produccion.imagen,
      objeto3D: produccion.objeto3D,
      dimensiones: produccion.dimensiones,
    });
    
    await nuevoProducto.save();

    produccion.estado = "Confirmado";
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

    res.json({ producto: nuevoProducto, logistica: trasladoLogistico });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};