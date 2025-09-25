import mongoose from "mongoose";

const productoTiendaSchema = new mongoose.Schema({
  idProductoTienda: {
    type: String,
    required: true,
    unique: true
  },
  nombre: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    default: ""
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
  imagen: {
    type: String,
    default: ""
  },
  dimensiones: {
    alto: { type: Number },
    ancho: { type: Number },
    profundidad: { type: Number }
  },
  objeto3D: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Objeto3D" // para vincular con el modelo 3D en RA
  },
  
  // ... (tus campos existentes)
  activo: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

export default mongoose.model("ProductoTienda", productoTiendaSchema);
