import ProductoTienda from "../models/productoTienda.model.js";

// Función para generar un ID único
const generarCodigoInterno = (nombre) => {
  const prefijo = nombre.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-5);
  const random = Math.floor(Math.random() * 1000);
  return `${prefijo}-${timestamp}-${random}`;
};

export const crearProducto = async (req, res) => {
  try {
    const idProductoTienda = generarCodigoInterno(req.body.nombre);
    const productoData = { ...req.body, idProductoTienda };
    const producto = new ProductoTienda(productoData);
    await producto.save();
    res.status(201).json(producto);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const listarProductos = async (req, res) => {
  try {
    // Solo muestra los productos que tienen el estado activo: true
    const productos = await ProductoTienda.find({ activo: true }).populate("proveedor objeto3D");
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizarProducto = async (req, res) => {
  const producto = await ProductoTienda.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(producto);
};

export const eliminarProducto = async (req, res) => {
  try {
    // En lugar de borrar, actualiza el estado 'activo' a false
    const producto = await ProductoTienda.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true } // Para devolver el documento actualizado
    );
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json({ message: "Producto eliminado lógicamente (inactivado)" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
