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
        enum: ['Operativa', 'En mantenimiento', 'Fuera de servicio'],
        default: 'Operativa'
    },
    ultimoMantenimiento: {
        type: Date,
        default: Date.now
    },
    proximoMantenimiento: {
        type: Date
    },
    eficiencia: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
    }
}, { timestamps: true });

export default mongoose.model("Maquina", maquinaSchema);
