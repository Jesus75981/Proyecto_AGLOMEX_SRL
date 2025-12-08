import mongoose from "mongoose";

const ventaSchema = new mongoose.Schema({
  numVenta: {
    type: Number,
    required: true,
    unique: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cliente", // relación con cliente.model.js
    required: false // Opcional para ventas sin cliente registrado
  },
  productos: [
    {
      producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductoTienda", // relación con productoTienda.models.js
        required: true
      },
      cantidad: Number,
      precioUnitario: Number,
      precioTotal: Number
    }
  ],
  serviciosAdicionales: [
    {
      nombre: { type: String, required: true },
      costo: { type: Number, required: true },
    },
  ],

  metodosPago: [
    {
      tipo: {
        type: String,
        enum: ["Efectivo", "Transferencia", "Cheque", "Crédito", "Tarjeta"],
        required: true
      },
      monto: {
        type: Number,
        required: true
      }
    }
  ],
  saldoPendiente: {
    type: Number,
    default: 0
  },
  metodoPago: { // Mantenido por compatibilidad, pero se prefiere metodosPago
    type: String,
    enum: ["Efectivo", "Transferencia", "Cheque", "Credito", "Tarjeta"],
    required: false
  },
  banco: String,
  anticipo: { type: Number, default: 0 },
  metodoEntrega: {
    type: String,
    enum: ["Envio Domicilio", "Recojo en Tienda", "Recojo en Almacen", "Envio Nacional"],
    default: "Recojo en Tienda"
  },
  numFactura: { type: String, required: true },
  observaciones: String
}, { timestamps: true });

export default mongoose.model("Venta", ventaSchema);
