import Venta from "../models/venta.js";

export const registrarVenta = async (req, res) => {
  try {
    const { serviciosAdicionales, ...ventaData } = req.body;
    
    // Suma el costo de los servicios al total de la venta
    const totalVenta = ventaData.total + (serviciosAdicionales ? serviciosAdicionales.reduce((acc, s) => acc + s.costo, 0) : 0);

    const venta = new Venta({ ...ventaData, serviciosAdicionales, total: totalVenta });
    await venta.save();

    // Crea el registro de logística asociado a esta venta
    const pedidoNumero = await getNextSequenceValue('pedidoNumero');
    const registroLogistica = new Logistica({
      pedidoNumero: pedidoNumero,
      cliente: venta.cliente,
      productos: venta.productos,
      tipoMovimiento: "Envío a Cliente",
      direccionEntrega: req.body.direccionEntrega,
      metodoEntrega: req.body.metodoEntrega,
      costoAdicional: serviciosAdicionales ? serviciosAdicionales.reduce((acc, s) => acc + s.costo, 0) : 0,
    });

    await registroLogistica.save();

    res.status(201).json({ venta, logistica: registroLogistica });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const listarVentas = async (req, res) => {
  const ventas = await Venta.find().populate("cliente productos.producto");
  res.json(ventas);
};
