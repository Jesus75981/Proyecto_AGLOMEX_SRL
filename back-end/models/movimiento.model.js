import mongoose from "mongoose";

const movimientoSchema = new mongoose.Schema({
    producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductoTienda",
        required: true,
    },
    tipo: {
        type: String,
        enum: ["Entrada", "Salida", "Ajuste"],
        required: true,
    },
    cantidad: {
        type: Number,
        required: true,
    },
    motivo: {
        type: String,
        required: true,
    },
    referencia: { // Puede ser un numCompra, numVenta, o una descripción de ajuste
        type: String,
        required: true,
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    stockAnterior: {
        type: Number,
        required: true,
    },
    stockActual: {
        type: Number,
        required: true,
    }
}, { timestamps: true });

export default mongoose.model("Movimiento", movimientoSchema);
