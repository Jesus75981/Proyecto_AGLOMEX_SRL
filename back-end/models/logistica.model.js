// models/logistica.model.js
import mongoose from "mongoose";

const logisticaSchema = new mongoose.Schema({
  pedidoNumero: {
    type: Number,
    required: true,
    unique: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cliente",
    required: true
  },
  productos: [
    {
      producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductoTienda",
        required: true
      },
      cantidad: { type: Number, required: true }
      // ❌ ELIMINAR: precioUnitario y precioTotal (no necesarios en logística)
    }
  ],
  fechaPedido: {
    type: Date,
    default: Date.now
  },
  fechaEntrega: {  // ✅ AGREGAR: Campo que espera el frontend
    type: Date,
    required: true
  },
  estado: {
    type: String,
    enum: ["pendiente", "en_proceso", "despachado", "entregado", "cancelado"], // ✅ MINÚSCULAS
    default: "pendiente"
  },
  direccionEnvio: {  // ✅ CAMBIAR: de direccionEntrega a direccionEnvio (OBJETO)
    calle: { type: String, required: true },
    ciudad: { type: String, required: true },
    departamento: { type: String, required: true }, // ✅ AGREGAR: departamento
    codigoPostal: { type: String }
  },
  metodoEntrega: {
    type: String,
    enum: ["Recojo en Tienda", "Envio Domicilio", "Envio Departamental"], // ✅ CORREGIR: "Evio" → "Envio"
    default: "Envio Domicilio"
  },
  tipoMovimiento: {
    type: String,
    enum: ["Envío a Cliente", "Traslado Interno"],
    default: "Envío a Cliente",
  },
  costoAdicional: {
    type: Number,
    default: 0,
  },
  observaciones: {
    type: String,
    default: ""
  }
}, { timestamps: true });

export default mongoose.model("Logistica", logisticaSchema);