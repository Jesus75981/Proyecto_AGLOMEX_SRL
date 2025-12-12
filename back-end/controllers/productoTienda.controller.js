// controllers/productoTienda.controller.js
import ProductoTienda from "../models/productoTienda.model.js";
import Objeto3D from "../models/objetos3d.model.js";
import Proveedor from "../models/proveedores.model.js";
import * as tripoService from "../services/tripo.service.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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
    // Aligned with Tripo service expectation: public/uploads
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
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
    const { nombre, color, categoria, codigo, tipo } = req.body;

    if (!nombre || nombre.trim().length === 0) {
      return res.status(400).json({ error: 'El campo "nombre" es obligatorio y no puede estar vacío.' });
    }

    if (!tipo || tipo.trim().length === 0) {
      // Si no se envía, se asigna por defecto en el modelo, pero si se envía vacío, validamos.
      // Opcional: forzar que se envíe siempre.
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
    const productoData = {
      ...req.body,
      idProductoTienda: idProductoTienda,
      // Adjust path to be accessible via URL if needed contextually, 
      // but tripo service needs to know where it is locally.
      // Remote was using /uploads/filename. We'll stick to that convention relative to public/
      imagen: req.file ? `/uploads/${req.file.filename}` : '',
      // El campo 'precioVenta' y 'descripcion'
      // se omiten si no se envían, y se permiten vacíos por el esquema.
    };

    // 4. Crear y guardar el producto
    const producto = new ProductoTienda(productoData);
    await producto.save();

    // 5. Respuesta exitosa
    res.status(201).json(producto);

    // 6. [ASYNC] Iniciar generación de modelo 3D si hay imagen
    // Integración de Tripo (Preservada del Local)
    if (producto.imagen) {
      // Si es ruta relativa local (comienza con /uploads/), la construimos completa para el log
      // El servicio de tripo ya maneja 'localhost' o rutas relativas si lo adaptamos, 
      // pero aquí simplemente pasamos lo que guardamos.
      // tripo.service.js espera una URL o path. Si pasamos '/uploads/foo.jpg', 
      // necesitamos que el servicio sepa manejarlo.
      // Revisando tripo.service.js: asume que si tiene 'localhost' busca en public/uploads.
      // Si le pasamos solo '/uploads/file.jpg', no hace match con 'localhost'.
      // Vamos a simular una URL localhost para que tripo.service.js active su lógica de archivo local.
      const simulUrl = `http://localhost:5000${producto.imagen}`;

      (async () => {
        try {
          console.log(`[TRIPO] Iniciando generación 3D para producto ${producto.nombre}...`);
          const taskId = await tripoService.create3DTask(simulUrl);

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
    console.error('Error al crear producto (STACK TRACE):', err); // [MODIFIED] Log full object
    console.error('Mensaje de error:', err.message);


    // Mongoose Validation Errors (por ejemplo, si falta 'imagen' o 'dimensiones')
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ error: errors.join(', ') });
    }

    // Duplicate Key Error
    if (err.code === 11000) {
      // Determine which field caused the error
      const field = Object.keys(err.keyPattern)[0];
      if (err.keyPattern.nombre && err.keyPattern.color) {
        return res.status(400).json({ error: `Ya existe un producto con el nombre '${req.body.nombre}' y color '${req.body.color}'.` });
      }
      return res.status(400).json({ error: `Ya existe un producto con este ${field} (${err.keyValue[field]}).` });
    }
    // Otros errores del servidor
    res.status(500).json({ error: 'Error interno del servidor al crear producto.', details: err.message }); // [MODIFIED] Return details
  }
};

// Listar productos activos con inventario disponible
export const listarProductos = async (req, res) => {
  try {
    // Construir el filtro base (solo productos activos)
    // Preservamos la logica de Remote (filtro) pero podemos sumar la de Local (cantidad > 0) si se desea.
    // El usuario "queria el formulario de compras completo" (Remote).
    // El catalogo (Local) usa cantidad > 0.
    // Vamos a combinar: activo:true Y cantidad > 0 para el Catalogo.
    // Pero esta funcion es general. Si ComprasPage la usa, quizas quiera ver productos sin stock?
    // Mejor dejemos el filtro de Remote que es mas flexible, OJO: CatalogPage.jsx usa su propia llamada?
    // CatalogPage.jsx llama a /productos.
    // Si cambio esto, el catalogo podria mostrar productos agotados.
    // Local version: { activo: true, cantidad: { $gt: 0 } }
    // Remote version: { activo: true } + filtro opcional tipo.

    // Compromiso: Usamos la versión Remote pero nos aseguramos que CatalogPage funcione.
    // CatalogPage.jsx del local prob filtra en frontend? O confiaba en el backend?
    // Revisando CatalogPage.jsx local: 
    // const productosDisponibles = productos.filter(p => !filtroCategoria || p.categoria === filtroCategoria);
    // No filtra por stock explícitamente en el render, solo "Agotado" si stock es 0.
    // Así que usar la versión Remote (que devuelve todos los activos) es SEGURO y MEJOR (permite ver agotados).

    const filtro = { activo: true };

    // Si se proporciona un tipo en la query string, agregarlo al filtro
    if (req.query.tipo) {
      filtro.tipo = req.query.tipo;
    }

    // Si se solicita disponibles=true, filtrar por cantidad > 0
    if (req.query.disponibles === 'true') {
      filtro.cantidad = { $gt: 0 };
    }

    // Buscar productos con el filtro y popular referencias
    const productos = await ProductoTienda.find(filtro).populate("proveedor objeto3D");
    res.json(productos);
  } catch (error) {
    console.error("Error en listarProductos:", error);
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

    // [New] Trigger 3D generation if image was updated
    if (req.file && producto.imagen) {
      const simulUrl = `http://localhost:5000${producto.imagen}`;
      (async () => {
        try {
          console.log(`[TRIPO] Iniciando generación 3D (Update) para producto ${producto.nombre}...`);
          const taskId = await tripoService.create3DTask(simulUrl);

          // Check if existing 3D object exists, if so update or create new?
          // Simple approach: Create new one and link it.
          const nuevoObjeto3D = new Objeto3D({
            producto: producto._id,
            sourceImage: producto.imagen,
            tripoTaskId: taskId,
            status: 'queued'
          });
          await nuevoObjeto3D.save();

          producto.objeto3D = nuevoObjeto3D._id;
          await producto.save();
          console.log(`[TRIPO] Tarea creada (Update): ${taskId}`);
        } catch (error) {
          console.error("[TRIPO] Error al iniciar generación (Update):", error.message);
        }
      })();
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
