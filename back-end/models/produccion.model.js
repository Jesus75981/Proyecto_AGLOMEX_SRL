import mongoose from "mongoose";

const produccionSchema = new mongoose.Schema({
  idProduccion: {
    type: String,
    required: true,
    unique: true
  },
  numeroOrden: {
    type: Number,
    unique: true
  },
  nombre: {
    type: String,
    required: true
  },
  cantidad: {
    type: Number,
    required: true
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
  materiales: [
    {
      material: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MateriaPrima"
      },
      cantidad: Number
    }
  ],
  productoFinal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductoTienda" // cuando la producción termina, se crea el producto en tienda
  },
  // Nuevos campos para progreso automático
  tiempoEstimado: {
    type: Number, // en dias
    required: true,
    default: 1 // 1 dia por defecto
  },
  fechaInicio: {
    type: Date,
    default: null
  },
  progreso: {
    type: Number, // 0-100
    default: 0,
    min: 0,
    max: 100
  },
  estado: {
    type: String,
    enum: ['Pendiente', 'En Progreso', 'Completado', 'Retrasado'],
    default: 'Pendiente'
  },
  notificacionesEnviadas: {
    type: Boolean,
    default: false
  },
  tiempoTranscurrido: {
    type: Number, // en horas
    default: 0
  }
}, { timestamps: true });

export default mongoose.model("Produccion", produccionSchema);
