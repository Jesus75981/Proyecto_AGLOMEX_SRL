import mongoose from 'mongoose';

// Define el esquema para las transacciones financieras
const finanzasSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ingreso', 'egreso'], // El tipo de transacción debe ser 'ingreso' o 'egreso'
    required: true
  },
  category: {
    type: String,
    enum: [
      // Ingresos
      'venta_productos',
      'anticipo_cobrado',
      'ingreso_manual',

      // Egresos
      'compra_materias',
      'compra_productos',
      'anticipo_pagado',
      'gasto_operativo',
      'egreso_manual'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['BOB', 'USD'], // Moneda: Bolivianos o Dólares
    default: 'BOB'
  },
  exchangeRate: {
    type: Number,
    min: 0,
    default: 1 // Tipo de cambio (1 por defecto para BOB)
  },
  amountBOB: {
    type: Number,
    required: true,
    min: 0 // Monto convertido a bolivianos
  },
  date: {
    type: Date,
    default: Date.now
  },
  // Referencias para tracking
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['Venta', 'Compra', 'Anticipo']
  },
  // Metadata adicional
  metadata: {
    metodoPago: String,
    banco: String,
    numFactura: String,
    numCompra: String,
    numVenta: String
  }
});

// Índices para optimización
finanzasSchema.index({ date: -1 });
finanzasSchema.index({ category: 1, date: -1 });
finanzasSchema.index({ type: 1, date: -1 });
finanzasSchema.index({ currency: 1 });

// Crea el modelo a partir del esquema
const Finanzas = mongoose.model('Finanzas', finanzasSchema);

export default Finanzas;
