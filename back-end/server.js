import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';

// Importa las rutas de finanzas y el modelo de usuario
import finanzasRoutes from './routes/finanzasRoutes.js';
// Importa las nuevas rutas de logística
import logisticaRoutes from './routes/logistica.routes.js';

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'employee'], required: true }
});
const User = mongoose.model('User', UserSchema);

const app = express();
const PORT = 5000;
// Es buena práctica usar una variable de entorno para el secreto
const jwtSecret = process.env.JWT_SECRET || 'tu_secreto_super_seguro';

app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/mueblesDB')
    .then(() => console.log('Conectado a la base de datos MongoDB'))
    .catch(err => console.error('Error de conexión a MongoDB:', err));

// --- Middleware de Autenticación para proteger rutas ---
const authMiddleware = (req, res, next) => {
    // Obtiene el token del encabezado de la autorización
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ message: 'No autorizado. Se requiere un token.' });
    }

    // Verifica el token
    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token no válido.' });
        }
        // Si el token es válido, adjunta la información del usuario a la solicitud
        req.user = user;
        next(); // Continúa con la siguiente función de middleware o el controlador de la ruta
    });
};

// Endpoint para crear cuentas de prueba
app.post('/api/create-test-users', async (req, res) => {
    try {
        await User.deleteMany({ username: { $in: ['dueno', 'tienda'] } });

        const adminPassword = await bcrypt.hash('admin123', 10);
        const adminUser = new User({ username: 'dueno', password: adminPassword, role: 'admin' });
        await adminUser.save();

        const employeePassword = await bcrypt.hash('admin123', 10);
        const employeeUser = new User({ username: 'tienda', password: employeePassword, role: 'employee' });
        await employeeUser.save();

        res.status(201).json({ message: 'Cuentas de prueba creadas con éxito.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al crear las cuentas de prueba.', error: err.message });
    }
});

// Endpoint de login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Usuario o contraseña incorrectos.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Usuario o contraseña incorrectos.' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '1h' });
        res.json({ token, user: { id: user._id, username: user.username, role: user.role } });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
});

// --- Usa las rutas de finanzas y el nuevo middleware de autenticación ---
app.use('/api/finanzas', authMiddleware, finanzasRoutes);
app.use('/api/logistica', authMiddleware, logisticaRoutes);

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});