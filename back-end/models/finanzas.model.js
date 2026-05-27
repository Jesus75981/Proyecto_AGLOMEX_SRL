import mongoose from 'mongoose';

// Define el esquema para las transacciones financieras
const finanzasSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ingreso', 'egreso', 'transferencia'], // El tipo de transacción debe ser 'ingreso', 'egreso' o 'transferencia'
    required: true
  },
  category: {
    type: String,
    enum: [
      // Ingresos
      'venta_productos',
      'anticipo_cobrado',
      'ingreso_manual',
      'cobro_venta',
      'otros_ingresos',

      // Egresos
      'compra_materias',
      'compra_productos',
      'anticipo_pagado',
      'gasto_operativo',
      'gastos_fijos',
      'gastos_variables',
      'salida_caja_deposito',
      'egreso_manual',
      'pago_deuda_compra',

      // Transferencias
      'transferencia_interna'
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
    enum: ['BOB'], 
    default: 'BOB'
  },
  exchangeRate: {
    type: Number,
    min: 0,
    default: 1 
  },
  amountBOB: {
    type: Number,
    required: true,
    min: 0 
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
    type: mongoose.Schema.Types.Mixed,
    default: {}
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
