import mongoose from "mongoose";

const produccionSchema = new mongoose.Schema({
  idProduccion: {
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
        ref: "Material"
      },
      cantidad: Number
    }
  ],
  productoFinal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductoTienda" // cuando la producción termina, se crea el producto en tienda
  }
}, { timestamps: true });

export default mongoose.model("Produccion", produccionSchema);
