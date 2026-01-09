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
  transportista: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transportista"
  },
  empresaEnvio: {
    type: String,
    default: ""
  },
  metodoEntrega: {
    type: String, // "Envio Domicilio", "Recojo en Tienda", etc.
    default: "Envio Domicilio"
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
  fechaPedido: {
    type: Date,
    default: Date.now
  },
  fechaEntrega: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    enum: ["pendiente", "en_proceso", "despachado", "entregado", "cancelado", "retrasado"],
    default: "pendiente"
  },
  tiempoEstimado: {
    type: String,
    default: "3-5 días"
  },
  ultimaActualizacion: {
    type: Date,
    default: Date.now
  },
  direccionEnvio: {
    calle: { type: String, required: true },
    ciudad: { type: String },
    departamento: { type: String },
    pais: { type: String }
  },
  costoAdicional: {
    type: Number,
    default: 0,
  },
  costoEnvio: {
    type: Number,
    default: 0
  },
  observaciones: {
    type: String,
    default: ""
  }
}, { timestamps: true });

export default mongoose.model("Logistica", logisticaSchema);