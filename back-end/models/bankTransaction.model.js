import mongoose from 'mongoose';

const bankTransactionSchema = new mongoose.Schema({
    cuentaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BankAccount',
        required: true
    },
    tipo: {
        type: String,
        enum: ['Deposito', 'Retiro', 'Compra', 'Ajuste'],
        required: true
    },
    monto: {
        type: Number,
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    descripcion: {
        type: String,
        required: true
    },
    comprobanteUrl: {
        type: String
    },
    referenciaId: {
        type: mongoose.Schema.Types.ObjectId
    }
});

const BankTransaction = mongoose.model('BankTransaction', bankTransactionSchema);
export default BankTransaction;
