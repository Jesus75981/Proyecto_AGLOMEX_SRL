import mongoose from "mongoose";

const materialSchema = new mongoose.Schema({
  idMaterial: {
    type: String,
    required: true,
    unique: true
  },
  nombre: {
    type: String,
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    default: 0
  },
  precioCompra: {
    type: Number,
    required: true
  },
  precioVenta: {
    type: Number,
    required: true
  },
  proveedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Proveedor"
  },
  activo: {
    type: Boolean,
    default: true
  },
  imagen: {
    type: String,
    default: ""
  }
}, { timestamps: true });

export default mongoose.model("Material", materialSchema);
