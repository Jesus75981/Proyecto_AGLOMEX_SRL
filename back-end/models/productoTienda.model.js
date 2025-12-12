import mongoose from "mongoose";
import crypto from 'crypto';


const productoTiendaSchema = new mongoose.Schema({
  idProductoTienda: {
    type: String,
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
    // unique: false (Explicitly not unique by itself)
  },
  descripcion: {
    type: String,
    default: ""
  },
  precioCompra: {
    type: Number,
    default: 0
  },
  precioVenta: {
    type: Number,
    default: 0
  },
  cantidad: {
    type: Number,
    default: 0
  },
  cantidadMinima: {
    type: Number,
    default: 5
  },
  cantidadMaxima: {
    type: Number,
    default: 100
  },
  tipo: { // <-- NUEVO CAMPO: Materia Prima o Producto Terminado
    type: String,
    enum: ['Materia Prima', 'Producto Terminado'],
    default: 'Producto Terminado',
    required: true
  },
  // -----------------------------------------------------------
  color: { // <-- NUEVO CAMPO REQUERIDO
    type: String,
    required: true
  },
  categoria: { // <-- CAMPO REQUERIDO - Ahora permite categorías dinámicas
    type: String,
    required: true
  },
  marca: {
    type: String,
    default: ""
  },
  cajas: {
    type: String,
    default: ""
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
    required: true,
    trim: true
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
  ventasAcumuladas: { // <-- ¡NUEVO CAMPO REQUERIDO PARA "MÁS VENDIDOS"!
    type: Number,
    default: 0
  },
  // ... (tus campos existentes)
  activo: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Compound Index: Enforce uniqueness on Name + Color
productoTiendaSchema.index({ nombre: 1, color: 1 }, { unique: true });

// HOOK DE MANTENIMIENTO: Genera automáticamente el idProductoTienda (SKU interno)
productoTiendaSchema.pre('save', function (next) {
  // Solo si el documento es nuevo y el idProductoTienda no está asignado
  if (this.isNew && !this.idProductoTienda) {
    // Genera un Identificador Único Universal
    this.idProductoTienda = crypto.randomUUID();
  }
  next();
});
export default mongoose.model("ProductoTienda", productoTiendaSchema);
