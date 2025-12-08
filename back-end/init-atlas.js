import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Importar todos los modelos
import Cliente from './models/cliente.model.js';
import User from './models/user.model.js';
import Proveedor from './models/proveedores.model.js';
import ProductoTienda from './models/productoTienda.model.js';
import Compra from './models/compra.model.js';
import Venta from './models/venta.model.js';
import Pedido from './models/pedido.model.js';
import Produccion from './models/produccion.model.js';
import Material from './models/materiales.model.js';
import Logistica from './models/logistica.model.js';
import Finanzas from './models/finanzas.model.js';
import Anticipo from './models/anticipo.model.js';
import Transportista from './models/transportista.model.js';
import Objeto3D from './models/objetos3d.model.js';
import Contador from './models/contador.model.js';

// Configuración
dotenv.config();

// URL de conexión a MongoDB Atlas
const mongoURI = 'mongodb+srv://troubleMker:8PHGKKYnudcpKRXl@aglomex.iscngaq.mongodb.net/proyecto_muebles?retryWrites=true&w=majority';

// Función para inicializar las colecciones en Atlas
const initAtlasCollections = async () => {
  try {
    console.log('🔄 Conectando a MongoDB Atlas...');
    await mongoose.connect(mongoURI);
    console.log('✅ Conexión a MongoDB Atlas exitosa');

    console.log('🔄 Creando colecciones...');

    // Crear contadores iniciales para numeración automática
    const contadores = [
      { nombre: 'numCompra', valor: 0 },
      { nombre: 'numVenta', valor: 0 },
      { nombre: 'pedidoNumero', valor: 0 },
      { nombre: 'idProduccion', valor: 0 },
      { nombre: 'idMaterial', valor: 0 }
    ];

    // Insertar contadores (solo si no existen)
    for (const contador of contadores) {
      const existe = await Contador.findOne({ nombre: contador.nombre });
      if (!existe) {
        await Contador.create(contador);
        console.log(`✅ Contador ${contador.nombre} creado`);
      } else {
        console.log(`ℹ️ Contador ${contador.nombre} ya existe`);
      }
    }

    // Forzar la creación de colecciones insertando un documento temporal y eliminándolo
    // Esto asegura que las colecciones se creen en Atlas

    // Cliente
    const tempCliente = new Cliente({
      nombre: 'Temporal',
      direccion: 'Temporal',
      telefono: '0000000000'
    });
    await tempCliente.save();
    await Cliente.deleteMany({ nombre: 'Temporal' });
    console.log('✅ Colección Clientes creada');

    // User
    const tempUser = new User({
      username: 'temporal',
      password: 'temporal123',
      nombre: 'Temporal',
      rol: 'admin'
    });
    await tempUser.save();
    await User.deleteMany({ username: 'temporal' });
    console.log('✅ Colección Users creada');

    // Proveedor
    const tempProveedor = new Proveedor({
      nombre: 'Temporal',
      contacto: { telefono: '0000000000', email: 'temporal@temp.com' },
      direccion: 'Temporal',
      nit: 'TEMP000'
    });
    await tempProveedor.save();
    await Proveedor.deleteMany({ nombre: 'Temporal' });
    console.log('✅ Colección Proveedores creada');

    // ProductoTienda
    const tempProducto = new ProductoTienda({
      idProductoTienda: 'TEMP-001',
      nombre: 'Temporal',
      color: 'Temporal',
      categoria: 'Otro',
      codigo: 'TEMP-001'
    });
    await tempProducto.save();
    await ProductoTienda.deleteMany({ nombre: 'Temporal' });
    console.log('✅ Colección ProductoTiendas creada');

    // Compra
    const tempCompra = new Compra({
      numCompra: 'TEMP-001',
      tipoCompra: 'Materia Prima',
      proveedor: tempProveedor._id,
      productos: [],
      metodosPago: [{ tipo: 'Efectivo', monto: 0.01 }]
    });
    await tempCompra.save();
    await Compra.deleteMany({ numCompra: 'TEMP-001' });
    console.log('✅ Colección Compras creada');

    // Venta
    const tempVenta = new Venta({
      numVenta: 0,
      cliente: tempUser._id,
      productos: [],
      metodoPago: 'Efectivo',
      numFactura: 'TEMP-001'
    });
    await tempVenta.save();
    await Venta.deleteMany({ numFactura: 'TEMP-001' });
    console.log('✅ Colección Ventas creada');

    // Pedido
    const tempPedido = new Pedido({
      cliente: tempCliente._id,
      productos: []
    });
    await tempPedido.save();
    await Pedido.deleteMany({ cliente: tempCliente._id });
    console.log('✅ Colección Pedidos creada');

    // Produccion
    const tempProduccion = new Produccion({
      idProduccion: 'TEMP-001',
      numeroOrden: 'ORD-TEMP-001',
      nombre: 'Temporal',
      cantidad: 1,
      precioCompra: 0,
      precioVenta: 0,
      categoria: 'Otro',
      tiempoEstimado: 24
    });
    await tempProduccion.save();
    await Produccion.deleteMany({ idProduccion: 'TEMP-001' });
    console.log('✅ Colección Producciones creada');

    // Material
    const tempMaterial = new Material({
      idMaterial: 'TEMP-001',
      nombre: 'Temporal',
      cantidad: 0,
      precioCompra: 0,
      precioVenta: 0
    });
    await tempMaterial.save();
    await Material.deleteMany({ idMaterial: 'TEMP-001' });
    console.log('✅ Colección Materiales creada');

    // Logistica
    const tempLogistica = new Logistica({
      pedidoNumero: 0,
      cliente: tempCliente._id,
      productos: [],
      fechaEntrega: new Date(),
      direccionEnvio: {
        calle: 'Temporal',
        ciudad: 'Temporal',
        departamento: 'Temporal'
      }
    });
    await tempLogistica.save();
    await Logistica.deleteMany({ pedidoNumero: 0 });
    console.log('✅ Colección Logisticas creada');

    // Finanzas
    const tempFinanza = new Finanzas({
      type: 'ingreso',
      description: 'Temporal',
      amount: 0
    });
    await tempFinanza.save();
    await Finanzas.deleteMany({ description: 'Temporal' });
    console.log('✅ Colección Finanzas creada');

    // Anticipo
    const tempAnticipo = new Anticipo({
      monto: 0,
      metodoPago: 'Transferencia'
    });
    await tempAnticipo.save();
    await Anticipo.deleteMany({ monto: 0 });
    console.log('✅ Colección Anticipos creada');

    // Transportista
    const tempTransportista = new Transportista({
      nombre: 'Temporal',
      contacto: 'Temporal',
      telefono: '0000000000',
      email: 'temporal@temp.com',
      tipo: 'Terrestre',
      costoBase: 0,
      tiempoEntrega: '1 día'
    });
    await tempTransportista.save();
    await Transportista.deleteMany({ nombre: 'Temporal' });
    console.log('✅ Colección Transportistas creada');

    // Objeto3D
    const tempObjeto3D = new Objeto3D({
      producto: tempProducto._id,
      sourceImage: 'temporal.jpg'
    });
    await tempObjeto3D.save();
    await Objeto3D.deleteMany({ sourceImage: 'temporal.jpg' });
    console.log('✅ Colección Objeto3Ds creada');

    console.log('🎉 Todas las colecciones han sido creadas exitosamente en MongoDB Atlas!');
    console.log('📋 Colecciones creadas:');
    console.log('   - clientes');
    console.log('   - users');
    console.log('   - proveedores');
    console.log('   - productotiendas');
    console.log('   - compras');
    console.log('   - ventas');
    console.log('   - pedidos');
    console.log('   - produccions');
    console.log('   - materials');
    console.log('   - logisticas');
    console.log('   - finanzas');
    console.log('   - anticipos');
    console.log('   - transportistas');
    console.log('   - objeto3ds');
    console.log('   - contadors');

  } catch (error) {
    console.error('❌ Error inicializando colecciones en Atlas:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
};

// Ejecutar inicialización
initAtlasCollections();
