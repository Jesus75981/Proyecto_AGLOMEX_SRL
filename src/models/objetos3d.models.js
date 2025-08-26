import mongoose from "mongoose";

const objeto3DSchema = new mongoose.Schema({
  linkObj3D: {
    type: String,
    required: true
  },
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductoTienda" // cada objeto 3D está vinculado a un producto del catálogo
  }
}, { timestamps: true });

export default mongoose.model("Objeto3D", objeto3DSchema);
