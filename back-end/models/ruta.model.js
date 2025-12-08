import mongoose from "mongoose";

const rutaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  origen: {
    type: String,
    required: true,
    trim: true
  },
  destino: {
    type: String,
    required: true,
    trim: true
  },
  transportista: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transportista",
    required: true
  },
  estado: {
    type: String,
    enum: ["Activa", "Inactiva"],
    default: "Activa"
  }
}, {
  timestamps: true
});

export default mongoose.model("Ruta", rutaSchema);
