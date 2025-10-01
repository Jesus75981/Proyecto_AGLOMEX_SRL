// back-end/server.js
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

// Configuración de variables de entorno
dotenv.config();

// Importa rutas existentes
import finanzasRoutes from './routes/finanzas.routes.js';
import logisticaRoutes from './routes/logistica.routes.js';

// Importa modelo de usuario
import User from './models/user.model.js';

// Inicialización del servidor
const app = express();
const PORT = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET || 'tu_secreto_super_seguro';

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/mueblesDB')
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error de conexión a MongoDB:', err));

// Middleware de autenticación
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No autorizado. Se requiere un token.' });

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token no válido.' });
        req.user = user;
        next();
    });
};

// --- Endpoints públicos ---

// Crear usuarios de prueba
app.post('/api/create-test-users', async (req, res) => {
    try {
        await User.deleteMany({ username: { $in: ['dueno', 'tienda', 'stock'] } });

        const admin = new User({ username: 'dueno', password: 'admin123', nombre: 'Dueño', rol: 'admin' });
        const empleadoTienda = new User({ username: 'tienda', password: 'admin123', nombre: 'Empleado Tienda', rol: 'empleado_tienda' });
        const empleadoStock = new User({ username: 'stock', password: 'admin123', nombre: 'Empleado Stock', rol: 'empleado_stock' });

        await admin.save();
        await empleadoTienda.save();
        await empleadoStock.save();

        res.status(201).json({ message: '✅ Cuentas de prueba creadas con éxito.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '❌ Error al crear cuentas de prueba', error: err.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ message: 'Username y password son requeridos' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Usuario o contraseña incorrectos.' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Usuario o contraseña incorrectos.' });

        const token = jwt.sign({ id: user._id, rol: user.rol }, jwtSecret, { expiresIn: '1h' });
        res.json({ 
            token, 
            user: { 
                id: user._id, 
                username: user.username, 
                nombre: user.nombre, 
                rol: user.rol 
            } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '❌ Error en el servidor.' });
    }
});

// --- RUTAS TEMPORALES PARA EL FRONTEND ---

// Clientes (para módulo de ventas)
app.get('/api/clientes', authMiddleware, (req, res) => {
    res.json([
        { _id: '1', nombre: 'Cliente Corporativo S.A.', nit: '1234567890', telefono: '123456789' },
        { _id: '2', nombre: 'Empresa XYZ Ltda.', nit: '0987654321', telefono: '987654321' },
        { _id: '3', nombre: 'Juan Pérez', nit: '1111111111', telefono: '555555555' }
    ]);
});

// Productos (para módulo de ventas e inventario)
app.get('/api/products', authMiddleware, (req, res) => {
    res.json([
        { 
            _id: '1', 
            idProductoTienda: 'SILLA-001', 
            nombre: 'Silla Ejecutiva Premium', 
            descripcion: 'Silla ergonómica para oficina',
            precioVenta: 350, 
            precioCompra: 180,
            cantidad: 25,
            categoria: 'Sillas'
        },
        { 
            _id: '2', 
            idProductoTienda: 'MESA-001', 
            nombre: 'Mesa de Reuniones', 
            descripcion: 'Mesa para sala de juntas',
            precioVenta: 1200, 
            precioCompra: 650,
            cantidad: 10,
            categoria: 'Mesas'
        }
    ]);
});

// Proveedores (para módulo de compras)
app.get('/api/suppliers', authMiddleware, (req, res) => {
    res.json([
        { _id: '1', nombre: 'Maderera El Bosque S.A.', contacto: 'Carlos Rodríguez', telefono: '111222333' },
        { _id: '2', nombre: 'Telas Premium Ltda.', contacto: 'María González', telefono: '444555666' }
    ]);
});

// Compras (módulo de compras)
app.get('/api/purchases', authMiddleware, (req, res) => {
    res.json([
        { _id: '1', numero: 'COMP-001', proveedor: 'Maderera El Bosque S.A.', fecha: '2024-01-15', total: 4500 },
        { _id: '2', numero: 'COMP-002', proveedor: 'Telas Premium Ltda.', fecha: '2024-01-20', total: 3200 }
    ]);
});

app.post('/api/purchases', authMiddleware, (req, res) => {
    res.json({ message: '✅ Compra registrada exitosamente', id: 'COMP-003' });
});

// Recetas (para módulo de fabricación)
app.get('/api/recipes', authMiddleware, (req, res) => {
    res.json([
        { _id: '1', nombre: 'Silla Ejecutiva', productos: ['Madera', 'Tela', 'Espuma'], tiempoFabricacion: 4 },
        { _id: '2', nombre: 'Mesa de Reuniones', productos: ['Madera', 'Vidrio', 'Metal'], tiempoFabricacion: 6 }
    ]);
});

// Fabricaciones
app.get('/api/fabrications', authMiddleware, (req, res) => {
    res.json([
        { _id: '1', producto: 'Silla Ejecutiva', cantidad: 10, estado: 'Completado', fecha: '2024-01-18' },
        { _id: '2', producto: 'Mesa de Reuniones', cantidad: 5, estado: 'En Proceso', fecha: '2024-01-20' }
    ]);
});

// Ventas
app.get('/api/ventas', authMiddleware, (req, res) => {
    res.json([
        { _id: '1', numero: 'VENT-001', cliente: 'Cliente Corporativo S.A.', fecha: '2024-01-10', total: 3500 },
        { _id: '2', numero: 'VENT-002', cliente: 'Empresa XYZ Ltda.', fecha: '2024-01-12', total: 1200 }
    ]);
});

app.post('/api/ventas', authMiddleware, (req, res) => {
    res.json({ message: '✅ Venta registrada exitosamente', numero: 'VENT-003' });
});

// --- Rutas protegidas existentes ---
app.use('/api/finanzas', authMiddleware, finanzasRoutes);
app.use('/api/logistica', authMiddleware, logisticaRoutes);

// Ruta de prueba básica
app.get('/api/test', (req, res) => {
    res.json({ message: '✅ API funcionando correctamente', timestamp: new Date().toISOString() });
});

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado',
        timestamp: new Date().toISOString()
    });
});

// ✅ CORRECCIÓN: Manejo de rutas no encontradas (SIN '*' )
app.use((req, res) => {
    res.status(404).json({ message: '❌ Ruta no encontrada: ' + req.originalUrl });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('❌ Error del servidor:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
});

// Servidor escuchando
app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🧪 Test route: http://localhost:${PORT}/api/test`);
    console.log(`🔐 Login: http://localhost:${PORT}/api/login`);
});