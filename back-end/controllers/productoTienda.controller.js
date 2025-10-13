// controllers/productoTienda.controller.js
import ProductoTienda from "../models/productoTienda.model.js";

// Función para generar código interno (más simple)
const generarCodigoInterno = (nombre) => {
  const prefijo = nombre.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${prefijo}-${timestamp}`;
};

export const crearProducto = async (req, res) => {
  try {
    console.log('📦 Datos recibidos para producto:', req.body); // ✅ DEBUG
    
    // ✅ VALIDAR CAMPOS REQUERIDOS
    const { nombre, precioCompra, precioVenta, cantidad } = req.body;
    
    if (!nombre || !precioCompra || !precioVenta) {
      return res.status(400).json({ 
        error: "Los campos nombre, precioCompra y precioVenta son requeridos" 
      });
    }

    // ✅ GENERAR CÓDIGO AUTOMÁTICAMENTE (no enviar desde frontend)
    const idProductoTienda = generarCodigoInterno(nombre);
    
    const productoData = { 
      ...req.body,
      idProductoTienda,
      cantidad: cantidad || 0, // Valor por defecto
      activo: true
    };

    console.log('✅ Creando producto con datos:', productoData);

    const producto = new ProductoTienda(productoData);
    await producto.save();
    
    res.status(201).json({
      message: "✅ Producto creado exitosamente",
      producto: producto
    });

  } catch (err) {
    console.error('❌ Error completo al crear producto:', err);
    res.status(400).json({ 
      error: "Error al crear producto",
      details: err.message 
    });
  }
};

export const listarProductos = async (req, res) => {
  try {
    const productos = await ProductoTienda.find({ activo: true })
      .select('idProductoTienda nombre descripcion precioCompra precioVenta cantidad categoria activo');
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ... (actualizarProducto y eliminarProducto igual)