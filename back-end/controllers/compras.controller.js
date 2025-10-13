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
    
    // 2. Si no se encontró por ID, intentar buscar por Nombre (si se proporciona)
    if (!producto && nombreProducto) {
        producto = await ProductoTienda.findOne({ nombre: nombreProducto });
    }

    // 3. Si AÚN no se encuentra, crearlo automáticamente con los datos mínimos.
    if (!producto) {
        if (!nombreProducto || !dimensiones || !imagenProducto) {
             throw new Error("Datos insuficientes para crear un nuevo producto. Se requiere nombre, dimensiones e imagen.");
        }

        const idProductoTienda = generarCodigoInterno(nombreProducto);
        
        // Creamos la nueva REFERENCIA en ProductoTienda con la cantidad inicial en 0
        const nuevoProducto = new ProductoTienda({
            nombre: nombreProducto,
            idProductoTienda: idProductoTienda,
            dimensiones: dimensiones,
            imagen: imagenProducto,
            // Los campos 'cantidad', 'precioCompra', 'precioVenta' quedan en sus defaults/null.
        });

        producto = await nuevoProducto.save();
        console.log(`[INVENTARIO]: Nueva referencia de producto creada: ${producto.nombre} (${producto._id})`);
    }

    return producto._id; // Retornamos el ID de MongoDB (ObjectId) del producto
};

export const registrarCompra = async (req, res) => {
    // 1. Obtener los datos de la compra del cuerpo de la solicitud (req.body)
    const datosCompra = req.body; 

    // Opcional: Recomendado usar transacciones para atomizar ambos pasos
    // const session = await startSession();
    // session.startTransaction();

    try {
        if (!datosCompra.productos || datosCompra.productos.length === 0) {
            return res.status(400).json({ message: "La compra debe contener al menos un producto." });
        }
        
        // 2. Guardar el documento de Compra en la colección 'compras'
        const nuevaCompra = new Compra(datosCompra);
        const compraGuardada = await nuevaCompra.save(/* { session } */);

        // 3. ACTUALIZAR EL INVENTARIO (productos_tienda) - AUMENTAR STOCK
        //    Usamos Promise.all para ejecutar todas las actualizaciones de stock
        //    de forma concurrente (más rápido) en lugar de secuencial.

        const updatePromises = datosCompra.productos.map(item => {
            // item: { producto: ID_PRODUCTO, cantidad: X, precioUnitario: Y, codigoProveedor: 'ABC' ...}
            const cantidadAumentada = item.cantidad; 

            // Objeto de actualización: siempre incrementa la cantidad
            const updateFields = { 
                $inc: { 
                    cantidad: cantidadAumentada 
                } 
            };
            
            // Si la compra proporciona un código de proveedor, actualizamos ese campo en el inventario.
            // Esto sobrescribe el código de proveedor anterior si existe un nuevo código.
            if (item.codigoProveedor) {
                updateFields.$set = {
                    codigoProveedor: item.codigoProveedor 
                };
            }
            // NOTA: El campo 'idProductoTienda' (código interno de la tienda) NO se toca,
            // por lo que se mantiene constante.

            // Devolvemos la Promesa de actualización sin el 'await'
            // findByIdAndUpdate busca el producto usando el ID de MongoDB (ObjectId)
            return ProductoTienda.findByIdAndUpdate(
                item.producto, // Usamos el campo 'producto' del array productos[] (el ObjectId)
                updateFields,
                { new: true } 
            ).orFail(new Error(`ProductoTienda con ID ${item.producto} no encontrado.`));
            // orFail asegura que si el producto no existe, la promesa falle.
        });

        // Esperamos a que TODAS las actualizaciones de stock terminen
        const inventarioActualizado = await Promise.all(updatePromises);
        
        // 4. Verificación de éxito (solo si no se usó orFail)
        // const inventarioActualizado = results.filter(p => p !== null); 

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
        // Si el error es una instancia de Error personalizada (por ejemplo, de orFail), lo usamos
        const errorMessage = error.name === 'DocumentNotFoundError' ? error.message : "Error interno del servidor";
        res.status(500).json({ message: errorMessage, error: error.message });
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