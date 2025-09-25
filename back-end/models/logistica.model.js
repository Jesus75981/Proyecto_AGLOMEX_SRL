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
      cantidad: { type: Number, required: true },
      precioUnitario: { type: Number, required: true },
      precioTotal: { type: Number, required: true }
    }
  ],
  fechaPedido: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: String,
    enum: ["Pendiente", "En Proceso", "Despachado", "Entregado", "Cancelado"],
    default: "Pendiente"
  },
  direccionEntrega: {
    type: String,
    required: true
  },
  metodoEntrega: {
    type: String,
    enum: ["Recojo en Tienda", "Envio Domicilio","Evio Departamental"],
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
