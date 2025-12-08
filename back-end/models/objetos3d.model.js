// models/objetos3d.models.js
import mongoose from "mongoose";

const objeto3DSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: "ProductoTienda", required: true },

  // entrada
  sourceImage: { type: String, required: true }, // URL o base64
  prompt: { type: String, default: "" },
  tripoTaskId: { type: String, default: "" }, // ID de la tarea en Tripo AI

  // estado del pipeline de Zero123
  status: { type: String, enum: ["queued", "processing", "done", "failed"], default: "queued" },
  error: { type: String, default: "" },

  // salidas
  glbUrl: { type: String, default: "" },   // para web y Android AR
  usdzUrl: { type: String, default: "" },  // para iOS AR Quick Look
  previewUrl: { type: String, default: "" }, // thumbnail o giro 360 mp4/gif

  // metadatos útiles
  scale: { type: Number, default: 1 },
  center: { type: [Number], default: [0, 0, 0] },
  dimensions: { // en metros, si puedes normalizar
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default mongoose.model("Objeto3D", objeto3DSchema);

