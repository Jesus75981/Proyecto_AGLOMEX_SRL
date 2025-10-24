import mongoose from "mongoose";

const pagoSchema = new mongoose.Schema({
    tipo: {
        type: String,
        // ENUM ACTUALIZADO: Incluye los 4 métodos de pago solicitados
        enum: ["Efectivo", "Transferencia", "Cheque", "Credito"],
        required: true,
    },
    monto: { // Monto específico pagado con este método
        type: Number,
        required: true,
        min: 0.01
    },
    referencia: String, // Número de Cheque, ID de transferencia, o número de operación
    cuenta: String, // Por ejemplo: "BANCO 01", "ANTICIPO 02", etc.
    fechaPago: {
        type: Date,
        default: Date.now
    }
}, { _id: false });
const compraSchema = new mongoose.Schema({
  numCompra: {
    type: String,
    required: true,
    unique: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  
  tipoCompra: {
    type: String,
    enum: ["Materia Prima", "Producto Terminado"],
    required: true,
  },
  proveedor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Proveedor", // Solo un proveedor por compra
        required: true,
    },
    productos: [ // <--- ¡ESTE ES EL ARRAY CLAVE!
        {
            producto: { 
                type: mongoose.Schema.Types.ObjectId,
                ref: "ProductoTienda", 
                required: true,
            },
            cantidad: { type: Number, required: true },
            precioUnitario: { type: Number, required: true },
            codigoProveedor: String
        },
    ],
   metodosPago: {
        type: [pagoSchema], // Un array de los pagos realizados
        required: true,
        validate: { // Validación personalizada para asegurar que el array no esté vacío
            validator: function(v) {
                return v.length > 0;
            },
            message: 'Debe especificar al menos un método de pago.'
        }
    },
    
    estado: {
        type: String,
        enum: ["Pendiente", "Pagada", "Parcialmente Pagada", "Cancelada"],
        default: "Pagada"
    },
    observaciones: String
}, { timestamps: true });


export default mongoose.model("Compra", compraSchema);
                                       