// models/pedido.model.js
import mongoose from "mongoose";

const pedidoSchema = new mongoose.Schema({
  pedidoNumero: {  // ✅ AGREGAR ESTE CAMPO NUEVO
    type: Number,
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
    }
  ],
  estado: { 
    type: String, 
    enum: ["pendiente", "en_produccion", "despachado", "entregado"], 
    default: "pendiente" 
  },
  serviciosAdicionales: [
    {
      nombre: { type: String, required: true },
      costo: { type: Number, required: true },
    },
  ],
  fechaPedido: { type: Date, default: Date.now },
  fechaEntrega: Date,
  direccionEntrega: { type: String },
  observaciones: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Pedido", pedidoSchema);