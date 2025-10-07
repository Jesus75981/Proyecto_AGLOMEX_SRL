import mongoose from "mongoose";
import crypto from 'crypto'; 

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

// HOOK DE MANTENIMIENTO: Genera automáticamente el idProductoTienda (SKU interno)
productoTiendaSchema.pre('save', function(next) {
    // Solo si el documento es nuevo y el idProductoTienda no está asignado
    if (this.isNew && !this.idProductoTienda) {
        // Genera un Identificador Único Universal
        this.idProductoTienda = crypto.randomUUID(); 
    }
    next();
});
export default mongoose.model("ProductoTienda", productoTiendaSchema);
