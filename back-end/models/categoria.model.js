import mongoose from 'mongoose';

const categoriaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    descripcion: {
        type: String,
        trim: true
    },
    activo: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

export default mongoose.model('Categoria', categoriaSchema);
