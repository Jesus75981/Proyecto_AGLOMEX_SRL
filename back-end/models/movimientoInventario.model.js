import mongoose from "mongoose";

const movimientoInventarioSchema = new mongoose.Schema({
    producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductoTienda",
        required: true
    },
    tipo: {
        type: String,
        enum: ["Entrada", "Salida", "Ajuste"],
        required: true
    },
    cantidad: {
        type: Number,
        required: true
    },
    motivo: {
        type: String,
        required: true
    },
    referencia: {
        type: String,
        default: ""
    },
    usuario: {
        type: String,
        default: "Sistema"
    },
    stockAnterior: {
        type: Number,
        required: true
    },
    stockActual: {
        type: Number,
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export default mongoose.model("MovimientoInventario", movimientoInventarioSchema);
