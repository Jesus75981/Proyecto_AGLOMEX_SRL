import mongoose from "mongoose";

const transportistaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  contacto: {
    type: String,
    required: true,
    trim: true
  },
  telefono: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  tipo: {
    type: String,
    enum: ["Terrestre", "Aéreo", "Marítimo", "Mixto"],
    required: true
  },
  costoBase: {
    type: Number,
    required: true,
    min: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  estado: {
    type: String,
    enum: ["Activo", "Inactivo"],
    default: "Activo"
  },
  cobertura: [{
    type: String,
    enum: ["Local", "Regional", "Nacional", "Internacional"]
  }],
  tiempoEntrega: {
    type: String,
    required: true,
    trim: true
  },
  observaciones: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
transportistaSchema.index({ nombre: 1 });
transportistaSchema.index({ tipo: 1 });
transportistaSchema.index({ estado: 1 });
transportistaSchema.index({ cobertura: 1 });

export default mongoose.model("Transportista", transportistaSchema);
