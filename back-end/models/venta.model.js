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
    ref: "User", // relación con user.model.js
    required: true
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
    
  metodoPago: {
    type: String,
    enum: ["Efectivo", "Transferencia", "Cheque", "Credito"],
    required: true
  },
  banco: String,
  anticipo: { type: Number, default: 0 },
  numFactura: { type: String, required: true },
  observaciones: String
}, { timestamps: true });

export default mongoose.model("Venta", ventaSchema);
