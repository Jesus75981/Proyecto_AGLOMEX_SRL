import mongoose from "mongoose";

const historialPagoSchema = new mongoose.Schema({
    monto: {
        type: Number,
        required: true,
        min: 0.01
    },
    tipoPago: {
        type: String,
        enum: ["Efectivo", "Transferencia", "Cheque"],
        required: true
    },
    referencia: String, // Ej: número de transacción, número de cheque
    fechaPago: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const deudaVentaSchema = new mongoose.Schema({
    ventaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Venta",
        required: true,
        unique: true // Una deuda por venta
    },
    cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cliente",
        required: true
    },
    montoOriginal: {
        type: Number,
        required: true,
        min: 0
    },
    montoPagado: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    saldoActual: {
        type: Number,
        required: true,
        min: 0
    },
    estado: {
        type: String,
        enum: ["Pendiente", "Parcialmente Pagada", "Pagada"],
        default: "Pendiente"
    },
    historialPagos: [historialPagoSchema],
    fechaCreacion: {
        type: Date,
        default: Date.now
    },
    ultimaActualizacion: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Middleware para actualizar ultimaActualizacion antes de guardar
deudaVentaSchema.pre('save', function(next) {
    this.ultimaActualizacion = Date.now();
    next();
});

export default mongoose.model("DeudaVenta", deudaVentaSchema);
