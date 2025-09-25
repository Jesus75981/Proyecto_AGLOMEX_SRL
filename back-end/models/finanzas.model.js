const mongoose = require('mongoose');

// Define el esquema para las transacciones financieras
const finanzasSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['ingreso', 'egreso'], // El tipo de transacción debe ser 'ingreso' o 'egreso'
    required: true
  },
  descripcion: {
    type: String,
    required: true
  },
  monto: {
    type: Number,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now // La fecha se establece automáticamente al momento de la creación
  }
});

// Crea el modelo a partir del esquema
const Finanzas = mongoose.model('Finanzas', finanzasSchema);

module.exports = Finanzas;
