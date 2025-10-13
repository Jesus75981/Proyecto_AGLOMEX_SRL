import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductoTienda from './models/productoTienda.model.js';
import crypto from 'crypto';

dotenv.config();

// Conexión a MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/proyecto_muebles')
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error de conexión a MongoDB:', err));

// Datos de ejemplo para productos
const productosEjemplo = [
  {
    idProductoTienda: crypto.randomUUID(),
    nombre: "Mesa de Centro",
    descripcion: "Mesa de centro moderna para sala de estar",
    precioVenta: 299.99,
    precioCompra: 199.99,
    cantidad: 15,
    categoria: "Mesas",
    material: "Madera de pino",
    dimensiones: {
      alto: 45,
      ancho: 120,
      profundidad: 60
    },
    color: "Café oscuro",
    imagen: "https://via.placeholder.com/150",
    activo: true
  },
  {
    idProductoTienda: crypto.randomUUID(),
    nombre: "Silla Comedor",
    descripcion: "Silla ergonómica para comedor",
    precioVenta: 149.99,
    precioCompra: 89.99,
    cantidad: 24,
    categoria: "Sillas",
    material: "Madera y tela",
    dimensiones: {
      alto: 90,
      ancho: 45,
      profundidad: 45
    },
    color: "Beige",
    imagen: "https://via.placeholder.com/150",
    activo: true
  },
  {
    idProductoTienda: crypto.randomUUID(),
    nombre: "Sofá 3 Plazas",
    descripcion: "Sofá cómodo para sala de estar",
    precioVenta: 599.99,
    precioCompra: 399.99,
    cantidad: 8,
    categoria: "Sofás",
    material: "Tela y espuma de alta densidad",
    dimensiones: {
      alto: 75,
      ancho: 220,
      profundidad: 85
    },
    color: "Gris",
    imagen: "https://via.placeholder.com/150",
    activo: true
  },
  {
    idProductoTienda: crypto.randomUUID(),
    nombre: "Estantería Modular",
    descripcion: "Estantería versátil para libros y decoración",
    precioVenta: 249.99,
    precioCompra: 149.99,
    cantidad: 12,
    categoria: "Estanterías",
    material: "MDF laminado",
    dimensiones: {
      alto: 180,
      ancho: 120,
      profundidad: 35
    },
    color: "Blanco",
    imagen: "https://via.placeholder.com/150",
    activo: true
  }
];

// Función para inicializar la base de datos
const inicializarProductos = async () => {
  try {
    // Eliminar productos existentes
    await ProductoTienda.deleteMany({});
    console.log('🧹 Productos eliminados');

    // Crear nuevos productos
    const productosCreados = await ProductoTienda.insertMany(productosEjemplo);
    console.log(`✅ ${productosCreados.length} productos creados con éxito`);

    // Cerrar conexión
    mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
  } catch (error) {
    console.error('❌ Error al inicializar productos:', error);
    mongoose.connection.close();
  }
};

// Ejecutar la inicialización
inicializarProductos();