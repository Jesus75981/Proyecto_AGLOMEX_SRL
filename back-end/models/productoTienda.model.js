import mongoose from "mongoose";
import crypto from 'crypto'; 


const DimensionesSchema = new mongoose.Schema({
    alto: { type: Number, required: true },
    ancho: { type: Number, required: true },
    profundidad: { type: Number, required: true }
}, { _id: false });
const productoTiendaSchema = new mongoose.Schema({
  nombre: {
        type: String,
        required: [true, 'El nombre del producto es obligatorio.'],
        trim: true,
        unique: true
    },
    idProductoTienda: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    imagen: {
        type: String,
        required: [true, 'La URL de la imagen es obligatoria.'],
    },
    dimensiones: {
        type: DimensionesSchema,
        required: [true, 'Las dimensiones del producto son obligatorias.'],
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
