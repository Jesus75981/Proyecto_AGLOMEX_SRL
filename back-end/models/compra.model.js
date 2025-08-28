import mongoose from "mongoose";

const compraSchema = new mongoose.Schema({
  numCompra: {
    type: Number,
    required: true,
    unique: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  proveedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Proveedor", // relación con proveedores.model.js
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

export default mongoose.model("Compra", compraSchema);
