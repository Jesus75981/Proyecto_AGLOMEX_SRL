// scripts/init-db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Importar modelos
import Proveedor from '../models/proveedores.model.js';
import ProductoTienda from '../models/productoTienda.model.js';

// Configuración
dotenv.config();
const mongoURI = 'mongodb://127.0.0.1:27017/proyecto_muebles';

// Datos iniciales
const proveedoresIniciales = [
  {
    nombre: 'Maderas del Norte',
    contacto: {
      telefono: '555-1234',
      email: 'contacto@maderasdelnorte.com'
    },
    direccion: 'Calle Industrial 123',
    nit: 'MADN123456ABC',
    activo: true,
    banco: {
      nombre: 'Banco Nacional',
      numeroCuenta: '1234567890'
    }
  },
  {
    nombre: 'Herrajes Modernos',
    contacto: {
      telefono: '555-5678',
      email: 'ventas@herrajesmodernos.com'
    },
    direccion: 'Av. Tecnológica 456',
    nit: 'HEMO789012XYZ',
    activo: true,
    banco: {
      nombre: 'Banco Comercial',
      numeroCuenta: '0987654321'
    }
  }
];

const productosIniciales = [
  {
    idProductoTienda: 'MDF-15MM',
    nombre: 'Tablero MDF 15mm',
    descripcion: 'Tablero de fibra de densidad media de 15mm',
    cantidad: 50,
    precioCompra: 300,
    precioVenta: 350,
    color: 'Natural',
    categoria: 'Otro',
    codigo: 'MDF001'
  },
  {
    idProductoTienda: 'BIS-PRES',
    nombre: 'Bisagras de presión',
    descripcion: 'Bisagras metálicas para muebles',
    cantidad: 200,
    precioCompra: 35,
    precioVenta: 45,
    color: 'Plateado',
    categoria: 'Otro',
    codigo: 'BIS001'
  }
];

// Función para inicializar la base de datos
const initDB = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(mongoURI);
    console.log('✅ Conectado a MongoDB');
    
    // Limpiar colecciones existentes
    await Proveedor.deleteMany({});
    await ProductoTienda.deleteMany({});
    
    // Insertar datos iniciales
    const proveedoresCreados = await Proveedor.insertMany(proveedoresIniciales);
    console.log(`✅ ${proveedoresCreados.length} proveedores creados`);
    
    const productosCreados = await ProductoTienda.insertMany(productosIniciales);
    console.log(`✅ ${productosCreados.length} productos creados`);
    
    console.log('✅ Base de datos inicializada correctamente');
    
  } catch (error) {
    console.error('❌ Error inicializando la base de datos:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('Conexión cerrada');
    process.exit(0);
  }
};

// Ejecutar inicialización
initDB();