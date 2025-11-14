import mongoose from "mongoose";

const proveedorSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  nombreComercial: {
    type: String,
    default: ""
  },
  contacto: {
    telefono: String,
    email: String
  },
  direccion: {
    type: String,
    default: ""
  },
  ubicacion: {
    type: String,
    default: ""
  },
  nit: {
    type: String
  },
  activo: {
    type: Boolean,
    default: true
  },
  bancos: [{
    nombre: String,
    numeroCuenta: String
  }]
}, { timestamps: true });

export default mongoose.model("Proveedor", proveedorSchema);
