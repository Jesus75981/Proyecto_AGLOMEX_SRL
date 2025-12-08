import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import productosRoutes from './routes/productos.routes.js';
import ventasRoutes from './routes/ventas.routes.js';
import produccionRoutes from './routes/produccion.routes.js';
import finanzasRoutes from './routes/finanzas.routes.js';
import alertasRoutes from './routes/alertas.routes.js';
import logisticaRoutes from './routes/logistica.routes.js';
import proveedoresRoutes from './routes/proveedores.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import comprasRoutes from './routes/compras.routes.js';
import materialesRoutes from './routes/materiales.routes.js';
import usersRoutes from './routes/users.routes.js';
import anticiposRoutes from './routes/anticipos.routes.js';
import deudaRoutes from './routes/deuda.routes.js';
import objetos3dRoutes from './routes/objetos3d.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';
<<<<<<< HEAD
import produccionRoutes from './routes/produccion.routes.js';
import proveedoresRoutes from './routes/proveedores.routes.js';
import ventasRoutes from './routes/ventas.routes.js';
import User from './models/user.model.js';
import productosRoutes from './routes/productos.routes.js';
import { listarProductos } from './controllers/productoTienda.controller.js';
import anticiposRoutes from './routes/anticipos.routes.js';
import transportistasRoutes from './routes/transportistas.routes.js';
import pedidosPublicRoutes from './routes/pedidos.public.routes.js';
import alertasRoutes from './routes/alertas.routes.js';
import materiaPrimaRoutes from './routes/materiaPrima.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { actualizarProgresoAutomatico, verificarRetrasos } from './controllers/produccion.controller.js';
import { enviarRecordatoriosPagosPendientes } from './services/notifications.service.js';
import Objeto3D from './models/objetos3d.model.js';
import * as tripoService from './services/tripo.service.js';
=======
import pedidosPublicRoutes from './routes/pedidos.public.routes.js';
import transportistasRoutes from './routes/transportistas.routes.js';
import categoriasRoutes from './routes/categorias.routes.js';
import maquinaRoutes from './routes/maquina.routes.js';
import movimientoInventarioRoutes from './routes/movimientoInventario.routes.js';
import rutaRoutes from './routes/ruta.routes.js';

dotenv.config();
>>>>>>> origin/main

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

// Configuración de archivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mueblesDB';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Conectado a MongoDB:', MONGODB_URI))
    .catch(err => console.error('Error conectando a MongoDB:', err));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/produccion', produccionRoutes);
app.use('/api/finanzas', finanzasRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/logistica', logisticaRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/materiales', materialesRoutes);
app.use('/api/usuarios', usersRoutes);
app.use('/api/anticipos', anticiposRoutes);
app.use('/api/deudas', deudaRoutes);
app.use('/api/objetos3d', objetos3dRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/pedidos-public', pedidosPublicRoutes);
app.use('/api/transportistas', transportistasRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/maquinas', maquinaRoutes);
app.use('/api/movimientos', movimientoInventarioRoutes);
app.use('/api/rutas', rutaRoutes);

<<<<<<< HEAD
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

// Login (RUTA PÚBLICA)
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

// Ruta pública para catálogo de productos (antes de las rutas protegidas)
app.get('/api/public/productos', listarProductos);
app.get('/api/productos', listarProductos);

// Ruta pública para categorías de productos
app.get('/api/public/productos/categorias', async (req, res) => {
    try {
        const categorias = await ProductoTienda.distinct('categoria', { activo: true });
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === RUTAS PROTEGIDAS (con autenticación) ===
app.use('/api/compras', authMiddleware, comprasRoutes);
app.use('/api/clientes', authMiddleware, clientesRoutes);
app.use('/api/logistica', authMiddleware, logisticaRoutes);
app.use('/api/materiales', authMiddleware, materialesRoutes);
app.use('/api/objetos3d', authMiddleware, objetos3dRoutes);
// Rutas públicas para recepción de pedidos (sin autenticación)
app.use('/api/pedidos-publico', pedidosPublicRoutes);
app.use('/api/pedidos', authMiddleware, pedidosRoutes);
app.use('/api/produccion', authMiddleware, produccionRoutes);
app.use('/api/productos', authMiddleware, productosRoutes);
app.use('/api/proveedores', authMiddleware, proveedoresRoutes);
app.use('/api/ventas', authMiddleware, ventasRoutes);
app.use('/api/finanzas', authMiddleware, finanzasRoutes);
app.use('/api/anticipos', authMiddleware, anticiposRoutes);
app.use('/api/transportistas', authMiddleware, transportistasRoutes);
app.use('/api/alertas', authMiddleware, alertasRoutes);
app.use('/api/materiaPrima', authMiddleware, materiaPrimaRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);

// Ruta de salud pública
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado',
        timestamp: new Date().toISOString()
    });
});

// Ruta de prueba pública
app.get('/api/test', (req, res) => {
    res.json({ message: '✅ API funcionando correctamente' });
});

//  MANEJO DE ERRORES FINAL
app.use((req, res, next) => {
    res.status(404).json({ message: '❌ Ruta no encontrada: ' + req.originalUrl });
=======
// Ruta base
app.get('/', (req, res) => {
    res.send('API del Sistema de Muebles funcionando');
>>>>>>> origin/main
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal!');
});

<<<<<<< HEAD
// === SISTEMA DE PROGRESO AUTOMÁTICO ===
// Ejecutar cada 5 minutos (300000 ms)
setInterval(async () => {
    try {
        await actualizarProgresoAutomatico();
        await verificarRetrasos();
    } catch (error) {
        console.error('❌ Error en el sistema automático:', error);
    }
}, 5 * 60 * 1000); // 5 minutos

// Ejecutar inmediatamente al iniciar
setTimeout(async () => {
    try {
        await actualizarProgresoAutomatico();
        await verificarRetrasos();
        console.log('✅ Sistema de progreso automático iniciado');
    } catch (error) {
        console.error('❌ Error al iniciar sistema automático:', error);
    }
}, 1000); // 1 segundo después del inicio

// === SISTEMA DE RECORDATORIOS AUTOMÁTICOS ===
// Ejecutar diariamente a las 9:00 AM
cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Ejecutando recordatorios de pagos pendientes...');
    try {
        await enviarRecordatoriosPagosPendientes();
        console.log('✅ Recordatorios enviados exitosamente');
    } catch (error) {
        console.error('❌ Error en recordatorios automáticos:', error);
    }
});

// === SISTEMA DE GENERACIÓN 3D (TRIPO AI) ===
// Ejecutar cada minuto para verificar tareas pendientes
cron.schedule('* * * * *', async () => {
    try {
        // Buscar objetos en estado 'queued' o 'processing' que tengan un tripoTaskId
        const objetosPendientes = await Objeto3D.find({
            status: { $in: ['queued', 'processing'] },
            tripoTaskId: { $exists: true, $ne: "" }
        });

        if (objetosPendientes.length > 0) {
            console.log(`[TRIPO] Verificando ${objetosPendientes.length} tareas pendientes...`);

            for (const obj of objetosPendientes) {
                try {
                    const statusData = await tripoService.getTaskStatus(obj.tripoTaskId);

                    // Mapear estado de Tripo a nuestro modelo
                    // Tripo status: 'queued', 'running', 'success', 'failed', 'cancelled'
                    let nuevoStatus = obj.status;

                    if (statusData.status === 'success') {
                        nuevoStatus = 'done';
                        // Guardar URL del modelo (glb)
                        // Tripo API v2 structure: output.pbr_model (string) or result.pbr_model.url
                        if (statusData.output && statusData.output.pbr_model) {
                            obj.glbUrl = statusData.output.pbr_model;
                        } else if (statusData.result && statusData.result.pbr_model && statusData.result.pbr_model.url) {
                            obj.glbUrl = statusData.result.pbr_model.url;
                        } else if (statusData.output && statusData.output.model) {
                            // Fallback for older structure
                            obj.glbUrl = statusData.output.model;
                        }
                    } else if (statusData.status === 'failed' || statusData.status === 'cancelled') {
                        nuevoStatus = 'failed';
                        obj.error = "Fallo en Tripo AI";
                    } else if (statusData.status === 'running') {
                        nuevoStatus = 'processing';
                    }

                    if (nuevoStatus !== obj.status) {
                        obj.status = nuevoStatus;
                        await obj.save();
                        console.log(`[TRIPO] Tarea ${obj.tripoTaskId} actualizada a: ${nuevoStatus}`);
                    }
                } catch (error) {
                    console.error(`[TRIPO] Error verificando tarea ${obj.tripoTaskId}:`, error.message);
                }
            }
        }
    } catch (error) {
        console.error('[TRIPO] Error en cron job:', error);
    }
});

// INICIO DEL SERVIDOR
=======
>>>>>>> origin/main
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
