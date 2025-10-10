// back-end/server.js
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

// Configuración de variables de entorno
dotenv.config();

import finanzasRoutes from './routes/finanzas.routes.js';
import comprasRoutes from './routes/compras.routes.js'; 
import clientesRoutes from './routes/clientes.routes.js';
import logisticaRoutes from './routes/logistica.routes.js';
import materialesRoutes from './routes/materiales.routes.js';
import objetos3dRoutes from './routes/objetos3d.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';
import produccionRoutes from './routes/produccion.routes.js';
import proveedoresRoutes from './routes/proveedores.routes.js';
import ventasRoutes from './routes/ventas.routes.js';
import User from './models/user.model.js'; 
import productoTiendaRoutes from './routes/productos.routes.js';

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
        res.status(500).json({ message: ' Error en el servidor.' });
    }
});

// RUTAS PARA EL FRONTEND 
app.use(authMiddleware); 
app.use('/api/compras', comprasRoutes); 
app.use('/api/clientes', clientesRoutes);
app.use('/api/logistica', logisticaRoutes);
app.use('/api/materiales', materialesRoutes);
app.use('/api/objetos3d', objetos3dRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/produccion', produccionRoutes);
app.use('/api/productos', productoTiendaRoutes); 
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/finanzas', finanzasRoutes);

//  MANEJO DE ERRORES FINAL
// Manejo de rutas no encontradas (404) 
app.use((req, res, next) => {
    res.status(404).json({ message: '❌ Ruta no encontrada: ' + req.originalUrl });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('❌ Error del servidor:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
});

// INICIO DEL SERVIDOR


app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/api/health`);
    console.log(` Login: http://localhost:${PORT}/api/login`);
});