import mongoose from 'mongoose';

const bankAccountSchema = new mongoose.Schema({
    nombreBanco: {
        type: String,
        required: true,
        trim: true
    },
    numeroCuenta: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    saldo: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);
export default BankAccount;
