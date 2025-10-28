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

        // Poblar los datos del cliente y productos para la respuesta
        await nuevaVenta.populate("cliente productos.producto");

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
  try {
    const ventas = await Venta.find()
      .populate("cliente productos.producto")
      .sort({ fecha: -1 }); // Ordenar por fecha descendente (más recientes primero)

    // Agregar campo 'estado' basado en la lógica de negocio
    const ventasConEstado = ventas.map(venta => ({
      ...venta.toObject(),
      estado: 'Completada' // Todas las ventas registradas se consideran completadas
    }));

    res.json(ventasConEstado);
  } catch (error) {
    console.error("Error al listar ventas:", error);
    res.status(500).json({
      msg: "Error interno del servidor al obtener las ventas.",
      error: error.message
    });
  }
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

// Nueva función para obtener estadísticas de ventas mensuales y anuales
export const getEstadisticasVentas = async (req, res) => {
  try {
    const { year, month } = req.query;

    let matchCondition = {};

    if (year) {
      matchCondition.fecha = {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${parseInt(year) + 1}-01-01`)
      };
    }

    if (month && year) {
      const startDate = new Date(`${year}-${month.padStart(2, '0')}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
      matchCondition.fecha = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // Agregación para obtener estadísticas mensuales
    const ventasMensuales = await Venta.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            year: { $year: "$fecha" },
            month: { $month: "$fecha" }
          },
          totalVentas: { $sum: 1 },
          totalIngresos: {
            $sum: {
              $reduce: {
                input: "$productos",
                initialValue: 0,
                in: { $add: ["$$value", { $multiply: ["$$this.cantidad", "$$this.precioUnitario"] }] }
              }
            }
          },
          productosVendidos: {
            $sum: {
              $reduce: {
                input: "$productos",
                initialValue: 0,
                in: { $add: ["$$value", "$$this.cantidad"] }
              }
            }
          }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Agregación para obtener estadísticas anuales
    const ventasAnuales = await Venta.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { year: { $year: "$fecha" } },
          totalVentas: { $sum: 1 },
          totalIngresos: {
            $sum: {
              $reduce: {
                input: "$productos",
                initialValue: 0,
                in: { $add: ["$$value", { $multiply: ["$$this.cantidad", "$$this.precioUnitario"] }] }
              }
            }
          },
          productosVendidos: {
            $sum: {
              $reduce: {
                input: "$productos",
                initialValue: 0,
                in: { $add: ["$$value", "$$this.cantidad"] }
              }
            }
          }
        }
      },
      {
        $sort: { "_id.year": 1 }
      }
    ]);

    // Estadísticas por producto más vendido
    const productosMasVendidos = await Venta.aggregate([
      { $match: matchCondition },
      { $unwind: "$productos" },
      {
        $group: {
          _id: "$productos.producto",
          totalVendido: { $sum: "$productos.cantidad" },
          totalIngresos: { $sum: { $multiply: ["$productos.cantidad", "$productos.precioUnitario"] } }
        }
      },
      {
        $lookup: {
          from: "productotiendas",
          localField: "_id",
          foreignField: "_id",
          as: "productoInfo"
        }
      },
      { $unwind: "$productoInfo" },
      {
        $project: {
          nombre: "$productoInfo.nombre",
          totalVendido: 1,
          totalIngresos: 1
        }
      },
      { $sort: { totalVendido: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ventasMensuales,
        ventasAnuales,
        productosMasVendidos
      }
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de ventas:", error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de ventas',
      error: error.message
    });
  }
};
