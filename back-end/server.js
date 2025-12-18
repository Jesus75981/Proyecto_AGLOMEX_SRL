import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import axios from 'axios';

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
// import materialesRoutes from './routes/materiales.routes.js';
import usersRoutes from './routes/users.routes.js';
// import anticiposRoutes from './routes/anticipos.routes.js';
import deudaRoutes from './routes/deuda.routes.js';
import objetos3dRoutes from './routes/objetos3d.routes.js';
import pedidosRoutes from './routes/pedidos.routes.js';
import pedidosPublicRoutes from './routes/pedidos.public.routes.js';
import transportistasRoutes from './routes/transportistas.routes.js';
import User from './models/user.model.js';
import { listarProductos } from './controllers/productoTienda.controller.js';
import categoriasRoutes from './routes/categorias.routes.js';
import maquinaRoutes from './routes/maquina.routes.js';
import movimientoInventarioRoutes from './routes/movimientoInventario.routes.js';
import rutaRoutes from './routes/ruta.routes.js';
import materiaPrimaRoutes from './routes/materiaPrima.routes.js';
import uploadRoutes from './routes/upload.routes.js';

// Importar modelos, controladores y middleware
import ProductoTienda from './models/productoTienda.model.js';
import Objeto3D from './models/objetos3d.model.js';
import * as tripoService from './services/tripo.service.js';
import { actualizarProgresoAutomatico, verificarRetrasos } from './controllers/produccion.controller.js';
import { enviarRecordatoriosPagosPendientes } from './services/notifications.service.js';
import { verifyToken as authMiddleware } from './middleware/auth.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET || 'secreto_super_secreto';
const streamPipeline = promisify(pipeline);

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de archivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/models', express.static(path.join(__dirname, 'public/models')));

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose conectado a:', MONGODB_URI);
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose error de conexión:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ Mongoose desconectado');
});

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Mongoose conectado a:', MONGODB_URI);

        // Asegurar que el usuario admin existe siempre
        try {
            const User = (await import('./models/user.model.js')).default;
            const adminExists = await User.findOne({ username: 'admin' });
            if (!adminExists) {
                const adminUser = new User({
                    username: 'admin',
                    password: 'admin123',
                    rol: 'admin',
                    nombre: 'Administrador',
                    email: 'admin@aglomex.com'
                });
                await adminUser.save();
                console.log('✅ Usuario "admin" restaurado automáticamente.');
            } else {
                console.log('✅ Usuario "admin" verificado.');
            }
        } catch (error) {
            console.error('⚠️ Error verificando usuario admin:', error);
        }
    })
    .catch(err => console.error('Error conectando a MongoDB:', err));



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
    const jwtSecret = process.env.JWT_SECRET || 'secreto_super_seguro'; // Definir secreto aquí o global

    if (!username || !password) {
        return res.status(400).json({ message: 'Username y password son requeridos' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Usuario o contraseña incorrectos.' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: 'Usuario o contraseña incorrectos.' });

        // Import jwt locally or globally if missing
        const jwt = (await import('jsonwebtoken')).default;
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

// Ruta pública para catálogo de productos
app.get('/api/public/productos', listarProductos);
// app.get('/api/productos', listarProductos); // Conflict with protected route? I'll leave the public one.

// Ruta pública para categorías de productos
app.get('/api/public/productos/categorias', async (req, res) => {
    // Necesitamos importar ProductoTienda si se usa aquí, o mover a controlador
    // Asumo que ProductoTienda se importa o se mueve a un controller. 
    // Para simplificar, lo dejo comentado si no está importado, o añado import.
    // Añadire import ProductoTienda arriba si no está.
    // Falta import ProductoTienda en imports globales... Arreglaré imports.
    try {
        const ProductoTienda = (await import('./models/productoTienda.model.js')).default;
        const categorias = await ProductoTienda.distinct('categoria', { activo: true });
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rutas de API generales
app.use('/api/auth', authRoutes);
app.use('/api/pedidos-publico', pedidosPublicRoutes);

// === RUTAS PROTEGIDAS (con autenticación) ===
app.use('/api/compras', authMiddleware, comprasRoutes);
app.use('/api/clientes', authMiddleware, clientesRoutes);
app.use('/api/logistica', authMiddleware, logisticaRoutes);
// app.use('/api/materiales', authMiddleware, materialesRoutes);
app.use('/api/objetos3d', authMiddleware, objetos3dRoutes);
app.use('/api/pedidos', authMiddleware, pedidosRoutes);
app.use('/api/produccion', authMiddleware, produccionRoutes);
app.use('/api/productos', productosRoutes);

app.use('/api/proveedores', authMiddleware, proveedoresRoutes);
app.use('/api/ventas', authMiddleware, ventasRoutes);
app.use('/api/finanzas', authMiddleware, finanzasRoutes);
// app.use('/api/anticipos', authMiddleware, anticiposRoutes);
app.use('/api/transportistas', authMiddleware, transportistasRoutes);
app.use('/api/alertas', authMiddleware, alertasRoutes);
app.use('/api/materiaPrima', authMiddleware, materiaPrimaRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/usuarios', usersRoutes);
app.use('/api/deudas', deudaRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/maquinas', maquinaRoutes);
app.use('/api/movimientos', movimientoInventarioRoutes);
app.use('/api/rutas', rutaRoutes);

// Ruta de salud pública
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        database: mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/test', (req, res) => {
    res.json({ message: '✅ API funcionando correctamente' });
});

// Ruta raiz
app.get('/', (req, res) => {
    res.send('API del Sistema de Muebles funcionando');
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal!');
});

// === SISTEMA DE PROGRESO AUTOMÁTICO ===
// Ejecutar cada 5 minutos (300000 ms)
setInterval(async () => {
    try {
        await actualizarProgresoAutomatico();
        await verificarRetrasos();
    } catch (error) {
        console.error('❌ Error en el sistema automático:', error);
    }
}, 5 * 60 * 1000);

// Ejecutar inmediatamente al iniciar
setTimeout(async () => {
    try {
        await actualizarProgresoAutomatico();
        await verificarRetrasos();
        console.log('✅ Sistema de progreso automático iniciado');
    } catch (error) {
        console.error('❌ Error al iniciar sistema automático:', error);
    }
}, 1000);

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

// Import WhatsApp Route and Service
import whatsappRoutes from './routes/whatsapp.routes.js';
import whatsappService from './services/whatsapp.service.js';

// Init WhatsApp Service
// Start slightly delayed to prevent blocking main server startup
setTimeout(() => {
    console.log('⏳ Iniciando servicio de WhatsApp en segundo plano...');
    try {
        whatsappService.initialize();
    } catch (error) {
        console.error('❌ Error al iniciar WhatsApp service:', error);
    }
}, 10000); // 10 seconds delay

// WhatsApp Routes
app.use('/api/whatsapp', whatsappRoutes);

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
                    let nuevoStatus = obj.status;

                    if (statusData.status === 'success') {
                        nuevoStatus = 'done';
                        let originalUrl = null;
                        if (statusData.output && statusData.output.pbr_model) {
                            originalUrl = statusData.output.pbr_model;
                        } else if (statusData.result && statusData.result.pbr_model && statusData.result.pbr_model.url) {
                            originalUrl = statusData.result.pbr_model.url;
                        } else if (statusData.output && statusData.output.model) {
                            originalUrl = statusData.output.model;
                        }

                        if (originalUrl) {
                            // Descargar archivo localmente
                            try {
                                const modelsDir = path.join(__dirname, 'public', 'models');
                                if (!fs.existsSync(modelsDir)) {
                                    fs.mkdirSync(modelsDir, { recursive: true });
                                }

                                const fileName = `${obj.tripoTaskId}.glb`;
                                const filePath = path.join(modelsDir, fileName);

                                console.log(`[TRIPO] Descargando modelo: ${originalUrl}`);
                                const response = await axios.get(originalUrl, { responseType: 'stream' });
                                await streamPipeline(response.data, fs.createWriteStream(filePath));

                                // Guardar URL local en DB
                                const port = process.env.PORT || 5000;
                                obj.glbUrl = `http://localhost:${port}/models/${fileName}`;

                                console.log(`[TRIPO] Modelo guardado localmente: ${obj.glbUrl}`);

                            } catch (downloadError) {
                                console.error(`[TRIPO] Error descargando modelo: ${downloadError.message}`);
                                // Fallback a URL remota si falla descarga
                                obj.glbUrl = originalUrl;
                            }
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

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
