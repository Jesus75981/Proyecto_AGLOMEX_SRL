import mongoose from "mongoose";

const clienteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    validate: {
      validator: function(v) {
        return v && v.trim().length > 0;
      },
      message: 'El nombre no puede estar vacío'
    }
  },
  empresa: {
    type: String,
    default: "" // si es persona natural puede quedar vacío
  },
  direccion: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    validate: {
      validator: function(v) {
        return v && v.trim().length > 0;
      },
      message: 'La dirección no puede estar vacía'
    }
  },
  telefono: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    validate: {
      validator: function(v) {
        return v && v.trim().length > 0;
      },
      message: 'El teléfono no puede estar vacío'
    }
  },
  email: {
    type: String,
    default: ""
  },
  nit: {
    type: String,
    default: ""
  },
  activo: {
    type: Boolean,
    default: true
  },
  ci: {
    type: String,
    default: ""
  }
}, { timestamps: true });

export default mongoose.model("Cliente", clienteSchema);
