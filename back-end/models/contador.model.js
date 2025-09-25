import mongoose from "mongoose";

const contadorSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
  },
  valor: {
    type: Number,
    required: true,
    default: 0,
  },
});

export default mongoose.model("Contador", contadorSchema);