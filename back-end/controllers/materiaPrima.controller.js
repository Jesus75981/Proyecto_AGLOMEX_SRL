import MateriaPrima from "../models/materiaPrima.model.js";

// Función para generar un ID único
const generarCodigoInterno = (nombre) => {
  // Genera un código simple: primeras 3 letras del nombre + 4 dígitos aleatorios
  const prefix = nombre ? nombre.substring(0, 3).toUpperCase() : 'MAT';
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomSuffix}`;
};

export const crearMateriaPrima = async (req, res) => {
  try {
    // 1. Generar el código interno usando el nombre (requerido)
    if (!req.body.nombre) {
      return res.status(400).json({ error: 'El campo "nombre" es obligatorio para generar el código interno.' });
    }

    const idMateriaPrima = generarCodigoInterno(req.body.nombre);

    // Helper for nested dimensions
    let dimensiones = req.body.dimensiones;
    if (!dimensiones && (req.body['dimensiones.alto'] || req.body['dimensiones.ancho'] || req.body['dimensiones.profundidad'])) {
      dimensiones = {
        alto: Number(req.body['dimensiones.alto'] || 0),
        ancho: Number(req.body['dimensiones.ancho'] || 0),
        profundidad: Number(req.body['dimensiones.profundidad'] || 0)
      };
    }

    // 2. Combinar los datos del body con el código generado
    const materiaPrimaData = {
      ...req.body,
      idMateriaPrima: idMateriaPrima,
      dimensiones: dimensiones || req.body.dimensiones,
      imagen: req.file ? `/uploads/${req.file.filename}` : '',
    };

    // 3. Crear y guardar la materia prima
    const materiaPrima = new MateriaPrima(materiaPrimaData);
    await materiaPrima.save();

    // 4. Respuesta exitosa
    res.status(201).json(materiaPrima);
  } catch (err) {
    // Mongoose Validation Errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    // Duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ error: 'El nombre o código interno de esta materia prima ya existe.' });
    }
    // Otros errores del servidor
    res.status(500).json({ error: 'Error interno del servidor al crear materia prima.' });
  }
};

export const listarMateriasPrimas = async (req, res) => {
  try {
    const materiasPrimas = await MateriaPrima.find({ activo: true }).populate("proveedor");
    res.json(materiasPrimas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizarMateriaPrima = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Parse dimensions if flattened
    if (!updateData.dimensiones && (req.body['dimensiones.alto'] || req.body['dimensiones.ancho'] || req.body['dimensiones.profundidad'])) {
      updateData.dimensiones = {
        alto: Number(req.body['dimensiones.alto'] || 0),
        ancho: Number(req.body['dimensiones.ancho'] || 0),
        profundidad: Number(req.body['dimensiones.profundidad'] || 0)
      };
    }

    if (req.file) {
      updateData.imagen = `/uploads/${req.file.filename}`;
    }

    const materiaPrima = await MateriaPrima.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!materiaPrima) {
      return res.status(404).json({ message: "Materia prima no encontrada" });
    }
    res.json(materiaPrima);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'El nombre o código interno de esta materia prima ya existe.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const buscarMateriaPrimaPorId = async (req, res) => {
  try {
    const materiaPrima = await MateriaPrima.findById(req.params.id).populate("proveedor");
    if (!materiaPrima) {
      return res.status(404).json({ message: "Materia prima no encontrada" });
    }
    res.json(materiaPrima);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const eliminarMateriaPrima = async (req, res) => {
  try {
    const materiaPrima = await MateriaPrima.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!materiaPrima) {
      return res.status(404).json({ message: "Materia prima no encontrada" });
    }
    res.json({ message: "Materia prima eliminada lógicamente (inactivada)" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await MateriaPrima.distinct('categoria', { activo: true });
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
