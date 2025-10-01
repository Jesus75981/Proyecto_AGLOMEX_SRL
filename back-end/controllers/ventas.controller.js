import Venta from "../models/venta.js";

export const registrarVenta = async (req, res) => {
    try {
        const ventaData = req.body;
        
        // 1. Crear el documento de Venta
        const nuevaVenta = new Venta(ventaData);
        await nuevaVenta.save();
        
        // 2. Iterar sobre los productos de la venta y actualizar el inventario y ventasAcumuladas
        const productosVendidos = ventaData.productos;
        const operacionesActualizacion = [];

        for (const item of productosVendidos) {
            const { producto: productoId, cantidad } = item; // productoId es el ObjectId del ProductoTienda

            // Prepara una operación de actualización atómica para el producto
            operacionesActualizacion.push(
                ProductoTienda.findByIdAndUpdate(
                    productoId,
                    { 
                        // $inc: Operación atómica para incrementar/decrementar campos
                        $inc: { 
                            cantidad: -cantidad, // Decrementa el stock (cantidad)
                            ventasAcumuladas: cantidad // Incrementa las ventas acumuladas
                        }
                    },
                    { new: true } // Opcional: devuelve el documento actualizado
                )
            );
        }

        // 3. Ejecutar todas las actualizaciones de productos simultáneamente
        await Promise.all(operacionesActualizacion);

        // 4. Respuesta exitosa
        return res.status(201).json({ 
            msg: "Venta registrada exitosamente y productos actualizados.",
            venta: nuevaVenta 
        });

    } catch (error) {
        console.error("Error al registrar la venta:", error);
        // Manejar posibles errores (ej. producto no encontrado, validación fallida)
        return res.status(500).json({ 
            msg: "Error interno del servidor al procesar la venta.", 
            error: error.message 
        });
    }
};

export const listarVentas = async (req, res) => {
  const ventas = await Venta.find().populate("cliente productos.producto");
  res.json(ventas);
};

// Nueva función para obtener ventas por día
export const getVentasByDay = async (req, res) => {
  try {
    // Obtener la fecha del cuerpo de la solicitud (asegúrate de que el formato es 'YYYY-MM-DD')
    const { date } = req.body;

    // Convertir la fecha de entrada en un objeto de fecha para la consulta
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Buscar ventas en la base de datos para ese día
    const ventasDelDia = await Venta.find({
      fecha: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    // Enviar los datos encontrados como una respuesta
    res.status(200).json({
      success: true,
      data: ventasDelDia
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener las ventas del día',
      error: error.message
    });
  }
};