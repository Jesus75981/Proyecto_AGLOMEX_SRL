// controllers/productoTienda.controller.js
import ProductoTienda from "../models/productoTienda.model.js";

// Función para generar un ID único
const generarCodigoInterno = (nombre) => {
    // Genera un código simple: primeras 3 letras del nombre + 4 dígitos aleatorios
    const prefix = nombre ? nombre.substring(0, 3).toUpperCase() : 'PRO';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomSuffix}`;
};


export const crearProducto = async (req, res) => {
    // Los datos que se esperan en req.body son:
    // { nombre: String, imagen: String, dimensiones: { alto: N, ancho: N, profundidad: N } }
    try {
        // 1. Validación adicional en el controlador
        const { nombre, color, categoria } = req.body;

        if (!nombre || nombre.trim().length === 0) {
            return res.status(400).json({ error: 'El campo "nombre" es obligatorio y no puede estar vacío.' });
        }

        if (!color || color.trim().length === 0) {
            return res.status(400).json({ error: 'El campo "color" es obligatorio y no puede estar vacío.' });
        }

        if (!categoria || categoria.trim().length === 0) {
            return res.status(400).json({ error: 'El campo "categoria" es obligatorio y no puede estar vacío.' });
        }

        // 2. Generar el código interno usando el nombre (requerido)
        const idProductoTienda = generarCodigoInterno(req.body.nombre);

        // 3. Combinar los datos del body con el código generado
        const productoData = {
            ...req.body,
            idProductoTienda: idProductoTienda,
            // Los campos 'precioVenta', 'cantidad' y 'descripcion'
            // se omiten si no se envían, y se permiten vacíos por el esquema.
        };

        // 4. Crear y guardar el producto
        const producto = new ProductoTienda(productoData);
        await producto.save();

        // 5. Respuesta exitosa
        res.status(201).json(producto);
    } catch (err) {
        console.log('Error al crear producto:', err); // Agregar logging para depurar
        // Mongoose Validation Errors (por ejemplo, si falta 'imagen' o 'dimensiones')
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ error: errors.join(', ') });
        }
        // Otros errores del servidor
        res.status(500).json({ error: 'Error interno del servidor al crear producto.' });
    }
};

// Listar productos activos
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
