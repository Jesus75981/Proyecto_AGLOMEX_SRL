// scripts/init-db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Importar modelos
import Proveedor from '../models/proveedores.model.js';
import ProductoTienda from '../models/productoTienda.model.js';
import Cliente from '../models/cliente.model.js';
import Logistica from '../models/logistica.model.js';
import Finanzas from '../models/finanzas.model.js';
import Venta from '../models/venta.model.js';
import Produccion from '../models/produccion.model.js';
import Compra from '../models/compra.model.js';
import DeudaCompra from '../models/deudaCompra.model.js';
import DeudaVenta from '../models/deudaVenta.model.js';
import Material from '../models/materiales.model.js';
import Pedido from '../models/pedido.model.js';
import Transportista from '../models/transportista.model.js';
import User from '../models/user.model.js';


// Configuración
dotenv.config();
const mongoURI = 'mongodb://127.0.0.1:27017/proyecto_muebles';


// Función para inicializar la base de datos
const initDB = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(mongoURI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar colecciones existentes
    await Proveedor.deleteMany({});
    console.log('✅ Colección de Proveedores eliminada');
    await ProductoTienda.deleteMany({});
    console.log('✅ Colección de Productos de Tienda eliminada');
    await Cliente.deleteMany({});
    console.log('✅ Colección de Clientes eliminada');
    await Logistica.deleteMany({});
    console.log('✅ Colección de Logística eliminada');
    await Finanzas.deleteMany({});
    console.log('✅ Colección de Finanzas eliminada');
    await Venta.deleteMany({});
    console.log('✅ Colección de Ventas eliminada');
    await Produccion.deleteMany({});
    console.log('✅ Colección de Producción eliminada');
    await Compra.deleteMany({});
    console.log('✅ Colección de Compras eliminada');
    await DeudaCompra.deleteMany({});
    console.log('✅ Colección de Deudas de Compra eliminada');
    await DeudaVenta.deleteMany({});
    console.log('✅ Colección de Deudas de Venta eliminada');
    await Material.deleteMany({});
    console.log('✅ Colección de Materiales eliminada');
    await Pedido.deleteMany({});
    console.log('✅ Colección de Pedidos eliminada');
    await Transportista.deleteMany({});
    console.log('✅ Colección de Transportistas eliminada');
    await User.deleteMany({ rol: { $ne: 'admin' } });
    console.log('✅ Colección de Usuarios (no administradores) eliminada');


    console.log('✅ Base de datos limpiada correctamente');

  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('Conexión cerrada');
    process.exit(0);
  }
};

// Ejecutar inicialización
initDB();