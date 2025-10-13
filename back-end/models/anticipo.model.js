import mongoose from 'mongoose';

const anticipoSchema = new mongoose.Schema({
  compraId: { type: mongoose.Schema.Types.ObjectId, ref: 'Compra' }, // Ref a compra si quieres
  monto: { type: Number, required: true },
  metodoPago: { type: String, required: true, default: 'Transferencia' },
  banco: { type: String },
  fecha: { type: Date, required: true, default: Date.now },
  activo: { type: Boolean, default: true } // Para soft-delete como en proveedores
});

export default mongoose.model('Anticipo', anticipoSchema);