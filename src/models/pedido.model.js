import mongoose from "mongoose";

const pedidoSchema = new mongoose.Schema({
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
  fechaPedido: { type: Date, default: Date.now },
  fechaEntrega: Date,
  direccionEntrega: { type: String },
  observaciones: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Pedido", pedidoSchema);
