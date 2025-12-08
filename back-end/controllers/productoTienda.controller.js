// controllers/productoTienda.controller.js
import ProductoTienda from "../models/productoTienda.model.js";
<<<<<<< HEAD
import Objeto3D from "../models/objetos3d.model.js";
import * as tripoService from "../services/tripo.service.js";
=======
import multer from 'multer';
import path from 'path';
import fs from 'fs';
>>>>>>> origin/main

// Función para generar un ID único
const generarCodigoInterno = (nombre) => {
  // Genera un código simple: primeras 3 letras del nombre + 4 dígitos aleatorios
  const prefix = nombre ? nombre.substring(0, 3).toUpperCase() : 'PRO';
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomSuffix}`;
};

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB límite
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)'));
    }
  }
});


export const crearProducto = async (req, res) => {
  // Los datos que se esperan en req.body son:
  // { nombre: String, imagen: String, dimensiones: { alto: N, ancho: N, profundidad: N } }
  try {
    // 1. Validación adicional en el controlador
<<<<<<< HEAD
    const { nombre, color, categoria, codigo } = req.body;
=======
    const { nombre, color, categoria, codigo, tipo } = req.body;
>>>>>>> origin/main

    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({ error: 'El campo "nombre" es obligatorio y no puede estar vacío.' });
    }

<<<<<<< HEAD
=======
    if (!tipo || tipo.trim().length === 0) {
      // Si no se envía, se asigna por defecto en el modelo, pero si se envía vacío, validamos.
      // Opcional: forzar que se envíe siempre.
    }

>>>>>>> origin/main
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
<<<<<<< HEAD
    const { cantidad, precioCompra, ...restoDelBody } = req.body;
    const productoData = {
      ...restoDelBody,
      idProductoTienda: idProductoTienda,
=======
    const productoData = {
      ...req.body,
      idProductoTienda: idProductoTienda,
      imagen: req.file ? `/uploads/${req.file.filename}` : '',
>>>>>>> origin/main
      // El campo 'precioVenta' y 'descripcion'
      // se omiten si no se envían, y se permiten vacíos por el esquema.
    };

    // 4. Crear y guardar el producto
    const producto = new ProductoTienda(productoData);
    await producto.save();

    // 5. Respuesta exitosa
    res.status(201).json(producto);
<<<<<<< HEAD

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
=======
>>>>>>> origin/main
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
<<<<<<< HEAD
    // Solo muestra los productos que tienen el estado activo: true y cantidad > 0
    const productos = await ProductoTienda.find({ activo: true, cantidad: { $gt: 0 } }).populate("proveedor objeto3D");
=======
    // Construir el filtro base (solo productos activos)
    const filtro = { activo: true };

    // Si se proporciona un tipo en la query string, agregarlo al filtro
    if (req.query.tipo) {
      filtro.tipo = req.query.tipo;
    }

    // Buscar productos con el filtro y popular referencias
    const productos = await ProductoTienda.find(filtro).populate("proveedor objeto3D");
>>>>>>> origin/main
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener un producto por ID
export const obtenerProducto = async (req, res) => {
  try {
    const producto = await ProductoTienda.findById(req.params.id).populate("proveedor objeto3D");
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizarProducto = async (req, res) => {
  try {
    const updateData = {};

    // Procesar campos del body, omitiendo vacíos para evitar errores de casteo
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== '' && req.body[key] !== undefined && req.body[key] !== null) {
        if (['cantidad', 'cajas'].includes(key)) {
          const parsed = parseInt(req.body[key]);
          updateData[key] = isNaN(parsed) ? 0 : parsed;
        } else if (['precioCompra', 'precioVenta'].includes(key)) {
          const parsed = parseFloat(req.body[key]);
          updateData[key] = isNaN(parsed) ? 0 : parsed;
        } else {
          updateData[key] = req.body[key];
        }
      }
    });

    // Asegurar que 'tipo' se actualice si está presente
    if (req.body.tipo) {
      updateData.tipo = req.body.tipo;
    }

    // Si hay un archivo de imagen, actualizar la ruta
    if (req.file) {
      updateData.imagen = `/uploads/${req.file.filename}`;
    }

    const producto = await ProductoTienda.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(producto);
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ error: error.message });
  }
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

// Exportar el middleware de multer para usarlo en rutas
export const uploadImage = upload.single('imagen');
