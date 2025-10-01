// models/Finanzas.js
import mongoose from 'mongoose';

// Define el esquema para las transacciones financieras
const finanzasSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ingreso', 'egreso'], // El tipo de transacción debe ser 'ingreso' o 'egreso'
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now // La fecha se establece automáticamente al momento de la creación
  }
});

// Crea el modelo a partir del esquema
const Finanzas = mongoose.model('Finanzas', finanzasSchema);

export default Finanzas;
