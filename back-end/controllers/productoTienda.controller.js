// controllers/productoTienda.controller.js
import ProductoTienda from "../models/productoTienda.model.js";
import Objeto3D from "../models/objetos3d.model.js";
import * as tripoService from "../services/tripo.service.js";

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
    const { nombre, color, categoria, codigo } = req.body;

    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({ error: 'El campo "nombre" es obligatorio y no puede estar vacío.' });
    }

    if (!color || color.trim().length === 0) {
      return res.status(400).json({ error: 'El campo "color" es obligatorio y no puede estar vacío.' });
    }

    if (!categoria || categoria.trim().length === 0) {
      return res.status(400).json({ error: 'El campo "categoria" es obligatorio y no puede estar vacío.' });
    }

    if (!codigo || codigo.trim().length === 0) {
      return res.status(400).json({ error: 'El campo "codigo" es obligatorio y no puede estar vacío.' });
    }

    // 2. Generar el código interno usando el nombre (requerido)
    const idProductoTienda = generarCodigoInterno(req.body.nombre);

    // 3. Combinar los datos del body con el código generado, excluyendo campos no deseados
    const { cantidad, precioCompra, ...restoDelBody } = req.body;
    const productoData = {
      ...restoDelBody,
      idProductoTienda: idProductoTienda,
      // El campo 'precioVenta' y 'descripcion'
      // se omiten si no se envían, y se permiten vacíos por el esquema.
    };

    // 4. Crear y guardar el producto
    const producto = new ProductoTienda(productoData);
    await producto.save();

    // 5. Respuesta exitosa
    res.status(201).json(producto);

    // 6. [ASYNC] Iniciar generación de modelo 3D si hay imagen
    if (producto.imagen && producto.imagen.startsWith('http')) {
      (async () => {
        try {
          console.log(`[TRIPO] Iniciando generación 3D para producto ${producto.nombre}...`);
          const taskId = await tripoService.create3DTask(producto.imagen);

          const nuevoObjeto3D = new Objeto3D({
            producto: producto._id,
            sourceImage: producto.imagen,
            tripoTaskId: taskId,
            status: 'queued'
          });
          await nuevoObjeto3D.save();

          // Vincular al producto
          producto.objeto3D = nuevoObjeto3D._id;
          await producto.save();
          console.log(`[TRIPO] Tarea creada: ${taskId}`);
        } catch (error) {
          console.error("[TRIPO] Error al iniciar generación:", error.message);
        }
      })();
    }
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

// Listar productos activos con inventario disponible
export const listarProductos = async (req, res) => {
  try {
    // Solo muestra los productos que tienen el estado activo: true y cantidad > 0
    const productos = await ProductoTienda.find({ activo: true, cantidad: { $gt: 0 } }).populate("proveedor objeto3D");
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

export const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await ProductoTienda.distinct('categoria', { activo: true });
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
