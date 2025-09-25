import Venta from "../models/venta.js";

export const registrarVenta = async (req, res) => {
  const venta = new Venta(req.body);
  await venta.save();
  res.status(201).json(venta);
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