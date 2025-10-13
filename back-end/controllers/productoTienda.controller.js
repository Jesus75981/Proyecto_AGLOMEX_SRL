// controllers/productoTienda.controller.js
import ProductoTienda from "../models/productoTienda.model.js";

// Función para generar código interno (más robusta)
const generarCodigoInterno = (nombre) => {
  const prefijo = nombre ? nombre.substring(0, 3).toUpperCase() : "PRO";
  const timestamp = Date.now().toString().slice(-6);
  return `${prefijo}-${timestamp}`;
};

// Crear producto en tienda
export const crearProducto = async (req, res) => {
  try {
    console.log("📦 Datos recibidos para producto:", req.body);

    const { nombre, precioCompra, precioVenta, cantidad } = req.body;

    if (!nombre || !precioCompra || !precioVenta) {
      return res.status(400).json({
        error: "Los campos nombre, precioCompra y precioVenta son requeridos",
      });
    }

    const idProductoTienda = generarCodigoInterno(nombre);

    const productoData = {
      ...req.body,
      idProductoTienda,
      cantidad: cantidad || 0,
      activo: true,
    };

    const producto = new ProductoTienda(productoData);
    await producto.save();

    res.status(201).json({
      message: "✅ Producto creado exitosamente",
      producto,
    });
  } catch (err) {
    console.error("❌ Error al crear producto:", err);
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ error: "El nombre o código interno ya existen." });
    }
    res.status(500).json({ error: "Error interno al crear producto." });
  }
};

// Listar productos activos
export const listarProductos = async (req, res) => {
  try {
    const productos = await ProductoTienda.find({ activo: true }).select(
      "idProductoTienda nombre descripcion precioCompra precioVenta cantidad categoria activo"
    );
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
