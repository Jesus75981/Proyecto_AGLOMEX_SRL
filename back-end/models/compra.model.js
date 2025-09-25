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
  tipoCompra: {
    type: String,
    enum: ["Materia Prima", "Producto Terminado"],
    required: true,
  },
  productos: [
    {
      producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductoTienda", // Asume un solo modelo para simplicidad
        required: true,
      },
      cantidad: Number,
      precioUnitario: Number,
      precioTotal: Number,
      codigoProveedor: String, // Se mantiene para rastrear el código de proveedor
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


export default mongoose.model("Compra", compraSchema);
                                       