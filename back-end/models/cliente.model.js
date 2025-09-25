import mongoose from "mongoose";

const clienteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  empresa: {
    type: String,
    default: "" // si es persona natural puede quedar vacío
  },
  direccion: {
    type: String,
    required: true
  },
  telefono: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: ""
  },
  nit: {
    type: String,
    default: ""
  },
  activo: {
    type: Boolean,
    default: true
  },
  ci: {
    type: String,
    default: ""
  }
}, { timestamps: true });

export default mongoose.model("Cliente", clienteSchema);
