// db.js
import mongoose from 'mongoose';

// URL de conexión
const mongoURI = 'mongodb://127.0.0.1:27017/proyecto_muebles'; // 'proyecto_muebles' es el nombre de tu DB

// Función para conectar
export const connectDB = async () => {
  try {
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
