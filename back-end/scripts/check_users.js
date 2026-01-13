
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/proyecto_muebles';

const usuarioSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rol: { type: String, enum: ['admin', 'tienda', 'produccion', 'empleado_tienda'], default: 'empleado_tienda' },
    fechaCreacion: { type: Date, default: Date.now }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

async function checkUsers() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connectado a MongoDB');

        const users = await Usuario.find({});
        console.log(`Encontrados ${users.length} usuarios:`);
        users.forEach(u => {
            console.log(`- Nombre: ${u.nombre}, Email: ${u.email}, Rol: ${u.rol}, ID: ${u._id}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkUsers();
