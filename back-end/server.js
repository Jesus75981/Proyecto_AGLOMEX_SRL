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
import pedidosPublicRoutes from './routes/pedidos.public.routes.js';
import transportistasRoutes from './routes/transportistas.routes.js';
import categoriasRoutes from './routes/categorias.routes.js';
import maquinaRoutes from './routes/maquina.routes.js';
import movimientoInventarioRoutes from './routes/movimientoInventario.routes.js';
import rutaRoutes from './routes/ruta.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Ruta base
app.get('/', (req, res) => {
    res.send('API del Sistema de Muebles funcionando');
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal!');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
