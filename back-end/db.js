// db.js
import mongoose from 'mongoose';

// Función para conectar
export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/proyecto_muebles';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conexión a MongoDB exitosa');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1); // termina la app si no puede conectarse
  }
};
