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
    ultimoMantenimiento: {
        type: Date,
        default: Date.now
    },
    proximoMantenimiento: {
        type: Date
    }
}, { timestamps: true });

export default mongoose.model("Maquina", maquinaSchema);
