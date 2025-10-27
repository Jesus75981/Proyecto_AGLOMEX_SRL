import Venta from "../models/venta.model.js";
import ProductoTienda from "../models/productoTienda.model.js";
import { registrarTransaccionFinanciera } from './finanzas.controller.js';

export const registrarVenta = async (req, res) => {
    try {
        const ventaData = req.body;

        // 1. VALIDACIÓN DE STOCK: Verificar que hay suficiente stock para todos los productos
        const productosVendidos = ventaData.productos;
        const productosInsuficientes = [];

        for (const item of productosVendidos) {
            const { producto: productoId, cantidad } = item;
            const producto = await ProductoTienda.findById(productoId);

            if (!producto) {
                return res.status(404).json({
                    msg: `Producto con ID ${productoId} no encontrado.`
                });
            }

            if (producto.cantidad < cantidad) {
                productosInsuficientes.push({
                    nombre: producto.nombre,
                    stockActual: producto.cantidad,
                    solicitado: cantidad
                });
            }
        }

        // Si hay productos con stock insuficiente, rechazar la venta
        if (productosInsuficientes.length > 0) {
            return res.status(400).json({
                msg: "Stock insuficiente para los siguientes productos:",
                productosInsuficientes,
                sugerencia: "Reduzca las cantidades o espere a que llegue más inventario."
            });
        }

        // 2. Crear el documento de Venta
        const nuevaVenta = new Venta(ventaData);
        await nuevaVenta.save();

        // 3. Actualizar el inventario y ventasAcumuladas (operaciones atómicas)
        const operacionesActualizacion = productosVendidos.map(item => {
            const { producto: productoId, cantidad } = item;

            return ProductoTienda.findByIdAndUpdate(
                productoId,
                {
                    $inc: {
                        cantidad: -cantidad, // Decrementa el stock
                        ventasAcumuladas: cantidad // Incrementa las ventas acumuladas
                    }
                },
                { new: true }
            );
        });

        // Ejecutar todas las actualizaciones simultáneamente
        await Promise.all(operacionesActualizacion);

        // 4. REGISTRAR TRANSACCIÓN FINANCIERA: Ingreso por venta de productos
        const totalVenta = productosVendidos.reduce((total, item) => total + (item.precioUnitario * item.cantidad), 0);
        await registrarTransaccionFinanciera(
            'ingreso',
            'venta_productos',
            `Venta #${ventaData.numVenta} - ${productosVendidos.length} producto(s)`,
            totalVenta,
            nuevaVenta._id,
            'Venta',
            {
                metodoPago: ventaData.metodoPago,
                numFactura: ventaData.numFactura,
                numVenta: ventaData.numVenta
            },
            'BOB', // Moneda: Bolivianos
            1 // Tipo de cambio: 1 para BOB
        );

        // 5. VERIFICAR ALERTAS DE STOCK BAJO: Después de la venta, verificar si algún producto quedó con stock bajo
        const alertasStockBajo = [];
        for (const item of productosVendidos) {
            const productoActualizado = await ProductoTienda.findById(item.producto);
            if (productoActualizado && productoActualizado.cantidad <= 5) { // Umbral de stock bajo: 5 unidades
                alertasStockBajo.push({
                    producto: productoActualizado.nombre,
                    stockActual: productoActualizado.cantidad,
                    mensaje: "Stock bajo - Considerar reabastecimiento"
                });
            }
        }

        // 6. Respuesta exitosa con alertas si las hay
        const respuesta = {
            msg: "Venta registrada exitosamente y productos actualizados.",
            venta: nuevaVenta
        };

        if (alertasStockBajo.length > 0) {
            respuesta.alertas = alertasStockBajo;
            respuesta.mensajeAdicional = "Algunos productos tienen stock bajo después de esta venta.";
        }

        return res.status(201).json(respuesta);

    } catch (error) {
        console.error("Error al registrar la venta:", error);
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
