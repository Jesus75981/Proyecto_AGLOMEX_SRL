import mongoose from "mongoose";

const maquinaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    tipo: {
        type: String,
        required: true
    },
    estado: {
        type: String,
        enum: ['Operativa', 'En mantenimiento', 'Fuera de servicio', 'En revisión', 'Necesita reparación'],
        default: 'Operativa'
    },
    costo: {
        type: Number,
        default: 0
    },
    ultimoMantenimiento: {
        type: Date,
        default: Date.now
    },
    proximoMantenimiento: {
        type: Date
    },
    historialMantenimiento: [{
        fecha: { type: Date, default: Date.now },
        costo: { type: Number, required: true },
        descripcion: { type: String, required: true }
    }]
}, { timestamps: true });

export default mongoose.model("Maquina", maquinaSchema);
