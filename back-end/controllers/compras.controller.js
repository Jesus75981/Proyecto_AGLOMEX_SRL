import Compra from "../models/compra.model.js";
const generarCodigoInterno = (nombre) => {
    // Genera un código simple: primeras 3 letras del nombre + 4 dígitos aleatorios
    const prefix = nombre ? nombre.substring(0, 3).toUpperCase() : 'PRO';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomSuffix}`;
};

/**
 * Función que encuentra un producto por ID o Nombre. Si no existe, lo crea automáticamente
 * con los datos mínimos requeridos (nombre, dimensiones, imagen).
 * @param {Object} itemData - Datos del producto proporcionados en el array de la compra.
 * @returns {Promise<string>} El ID de MongoDB (_id) del producto encontrado o creado.
 */
const encontrarOCrearProducto = async (itemData) => {
    const { productoId, nombreProducto, dimensiones, imagenProducto } = itemData;

    let producto = null;

    // 1. Intentar buscar por ID (ObjectId) si se proporciona (para productos existentes)
    if (productoId) {
        producto = await ProductoTienda.findById(productoId);
    }
    
    // 2. Si no se encontró por ID, intentar buscar por Nombre
    if (!producto && nombreProducto) {
        // Usamos una búsqueda insensible a mayúsculas/minúsculas o una búsqueda exacta
        // Aquí usamos una búsqueda exacta para evitar crear duplicados por error.
        producto = await ProductoTienda.findOne({ nombre: nombreProducto });
    }

    // 3. Si AÚN no se encuentra, crearlo automáticamente con los datos mínimos.
    if (!producto) {
        // Validamos que los datos mínimos (nombre, dimensiones, imagen) estén presentes
        if (!nombreProducto || !dimensiones || !imagenProducto) {
             throw new Error("Datos insuficientes para crear un nuevo producto. Se requiere nombre, dimensiones e imagen.");
        }

        const idProductoTienda = generarCodigoInterno(nombreProducto);
        
        // Creamos la nueva REFERENCIA en ProductoTienda. 
        // Los campos como cantidad y precios se dejarán en sus valores por defecto (ej. 0 o null)
        const nuevoProducto = new ProductoTienda({
            nombre: nombreProducto,
            idProductoTienda: idProductoTienda,
            dimensiones: dimensiones,
            imagen: imagenProducto,
            // Los demás campos (cantidad, precioCompra, etc.) son opcionales en el esquema ahora.
        });

        producto = await nuevoProducto.save();
        console.log(`[INVENTARIO]: Nueva referencia de producto creada: ${producto.nombre} (${producto._id})`);
    }

    return producto._id; // Retornamos el ID de MongoDB (_id) del producto
};


/**
 * Registra una Compra a Proveedor. 
 * Crea la referencia del producto si no existe, y AUMENTA el stock de todos los items.
 */
export const registrarCompra = async (req, res) => {
    const datosCompra = req.body; 

    // Opcional: Recomendado usar transacciones para atomizar ambos pasos
    // const session = await startSession();
    // session.startTransaction();

    try {
        if (!datosCompra.productos || datosCompra.productos.length === 0) {
            return res.status(400).json({ message: "La compra debe contener al menos un producto." });
        }
        
        // --- 1. PRE-PROCESAMIENTO: IDENTIFICAR O CREAR PRODUCTOS NUEVOS ---
        // Aquí transformamos los datos para asegurar que cada item tiene un ObjectId válido
        const preProcessPromises = datosCompra.productos.map(async (item) => {
            const productoObjectId = await encontrarOCrearProducto({
                productoId: item.producto,      // ID de MongoDB si existe (o null/undefined)
                nombreProducto: item.nombreProducto, // Nombre si es nuevo
                dimensiones: item.dimensiones,  // Dimensiones si es nuevo
                imagenProducto: item.imagenProducto  // Imagen si es nuevo
            });
            // Reemplazamos el campo 'producto' (que podría ser el nombre) con el ObjectId real
            return { ...item, producto: productoObjectId };
        });

        // Esperamos a que todos los productos hayan sido creados/identificados
        datosCompra.productos = await Promise.all(preProcessPromises);
        
        // --- 2. REGISTRAR LA COMPRA ---
        const nuevaCompra = new Compra(datosCompra);
        const compraGuardada = await nuevaCompra.save(/* { session } */);

        // --- 3. ACTUALIZAR EL INVENTARIO (productos_tienda) - AUMENTAR STOCK Y PRECIO COMPRA ---
        
        const updatePromises = datosCompra.productos.map(item => {
            const cantidadAumentada = item.cantidad; 
            const precioCompra = item.precioUnitario; // Asume que el precio unitario es el precio de compra

            // Objeto de actualización: incrementa la cantidad y establece el precio de compra y proveedor
            const updateFields = { 
                $inc: { 
                    cantidad: cantidadAumentada // Aumenta el stock
                },
                $set: {
                    precioCompra: precioCompra, // Sobrescribe el último precio de compra
                    // Si el proveedor se actualiza por ítem o a nivel de compra, ajusta aquí.
                    // proveedor: datosCompra.proveedor // Descomentar si quieres guardar el proveedor en el producto
                }
            };
            
            // findByIdAndUpdate busca el producto usando el ID de MongoDB (ObjectId)
            return ProductoTienda.findByIdAndUpdate(
                item.producto, // Usamos el campo 'producto' (el ObjectId)
                updateFields,
                { new: true } 
            ).orFail(new Error(`ProductoTienda con ID ${item.producto} no encontrado para actualizar stock.`));
        });

        // Ejecutamos TODAS las actualizaciones de stock y precios
        const inventarioActualizado = await Promise.all(updatePromises);
        
        // Opcional: Si usas transacciones, commitear aquí:
        // await session.commitTransaction();

        res.status(201).json({ 
            message: `Compra #${compraGuardada.numCompra} registrada y stock actualizado.`,
            compra: compraGuardada,
            inventarioAfectado: inventarioActualizado
        });

    } catch (error) {
        // Opcional: Si falló, abortar y deshacer cambios:
        // await session.abortTransaction();
        // session.endSession();
        console.error("Error al registrar la compra y actualizar stock:", error.message);
        
        // Capturamos errores de validación, de stock o errores de servidor
        const statusCode = error.name === 'ValidationError' || error.message.includes('insuficientes') || error.message.includes('crear') ? 400 : 500;
        res.status(statusCode).json({ message: "Error al registrar la compra.", error: error.message });
    }
};

/**
 * Lista las Compras registradas.
 */
export const listarCompras = async (req, res) => {
    try {
        const historial = await Compra.find()
                                        .populate('productos.producto') // Traer información del producto
                                        .populate('proveedor')         // Traer información del proveedor
                                        .limit(50)
                                        .sort({ fecha: -1 });
        res.status(200).json(historial);
    } catch (error) {
        res.status(500).json({ message: "Error al listar compras", error: error.message });
    }
};