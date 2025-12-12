import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

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

import Contador from '../models/contador.model.js';
import Movimiento from '../models/movimiento.model.js';
import Ruta from '../models/ruta.model.js';
import Objeto3D from '../models/objetos3d.model.js';
import Categoria from '../models/categoria.model.js';
import BankAccount from '../models/bankAccount.model.js';
import BankTransaction from '../models/bankTransaction.model.js';

dotenv.config();

// URI hardcoded to match server.js
const mongoURI = 'mongodb://localhost:27017/mueblesDB';

const clearDatabase = async () => {
    try {
        console.log('Connecting to:', mongoURI);
        await mongoose.connect(mongoURI);
        console.log('✅ Conectado a MongoDB');

        // Limpiar todas las colecciones
        await Proveedor.deleteMany({});
        console.log('✅ Proveedores eliminados');

        await ProductoTienda.deleteMany({});
        console.log('✅ Productos eliminados');

        await Cliente.deleteMany({});
        console.log('✅ Clientes eliminados');

        await Logistica.deleteMany({});
        console.log('✅ Logística eliminada');

        await Finanzas.deleteMany({});
        console.log('✅ Finanzas eliminadas');

        await Venta.deleteMany({});
        console.log('✅ Ventas eliminadas');

        await Produccion.deleteMany({});
        console.log('✅ Producción eliminada');

        await Compra.deleteMany({});
        console.log('✅ Compras eliminadas');

        await DeudaCompra.deleteMany({});
        console.log('✅ Deudas Compra eliminadas');

        await DeudaVenta.deleteMany({});
        console.log('✅ Deudas Venta eliminadas');

        await Material.deleteMany({});
        console.log('✅ Materiales eliminados');

        await Pedido.deleteMany({});
        console.log('✅ Pedidos eliminados');

        await Transportista.deleteMany({});
        console.log('✅ Transportistas eliminados');

        await Anticipo.deleteMany({});
        console.log('✅ Anticipos eliminados');

        await Contador.deleteMany({});
        console.log('✅ Contadores eliminados');

        await Movimiento.deleteMany({});
        console.log('✅ Movimientos eliminados');

        await Ruta.deleteMany({});
        console.log('✅ Rutas eliminadas');

        await Objeto3D.deleteMany({});
        console.log('✅ Objetos 3D eliminados');

        await Categoria.deleteMany({});
        console.log('✅ Categorías eliminadas');

        await BankAccount.deleteMany({});
        console.log('✅ Cuentas Bancarias eliminadas');

        await BankTransaction.deleteMany({});
        console.log('✅ Transacciones Bancarias eliminadas');

        // Limpiar usuarios y crear admin por defecto
        await User.deleteMany({});
        console.log('✅ Usuarios eliminados');

        // Crear usuario admin por defecto
        // Note: The User model pre-save hook handles password hashing
        const adminUser = new User({
            username: 'admin',
            password: 'password123', // Default password
            nombre: 'Administrador',
            rol: 'admin'
        });

        await adminUser.save();
        console.log('✅ Usuario admin creado por defecto (user: admin, pass: password123)');

        console.log('✨ Base de datos limpiada y reiniciada correctamente.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

clearDatabase();
