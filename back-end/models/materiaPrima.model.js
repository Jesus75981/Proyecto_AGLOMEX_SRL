import mongoose from "mongoose";

const materiaPrimaSchema = new mongoose.Schema({
  idMateriaPrima: {
    type: String,
    required: true,
    unique: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
    unique: true
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
  activo: {
    type: Boolean,
    default: true
  },
  imagen: {
    type: String,
    default: ""
  },
  color: {
    type: String,
    default: ""
  },
  categoria: {
    type: String,
    default: "Otro"
  },
  ubicacion: {
    type: String,
    default: ""
  },
  tamano: {
    type: String,
    default: ""
  },
  codigo: {
    type: String,
    default: ""
  },
  cantidadMinima: {
    type: Number,
    default: 10
  },
  cantidadMaxima: {
    type: Number,
    default: 100
  },
  marca: {
    type: String,
    default: ""
  },
  cajas: {
    type: String,
    default: ""
  },
  unidad: {
    type: String,
    default: "unidad"
  },
  dimensiones: {
    alto: { type: Number, default: 0 },
    ancho: { type: Number, default: 0 },
    profundidad: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default mongoose.model("MateriaPrima", materiaPrimaSchema);
