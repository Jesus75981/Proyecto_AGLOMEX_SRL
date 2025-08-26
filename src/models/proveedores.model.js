import mongoose from "mongoose";

const proveedorSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  contacto: {
    telefono: String,
    email: String
  },
  direccion: {
    type: String,
    default: ""
  },
  nit: {
    type: String
  },
  banco: {
    nombre: String,
    numeroCuenta: String
  }
}, { timestamps: true });

export default mongoose.model("Proveedor", proveedorSchema);
