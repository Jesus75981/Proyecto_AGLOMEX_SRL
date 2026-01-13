
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const mongoURI = 'mongodb://127.0.0.1:27017/proyecto_muebles';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    nombre: { type: String, required: true },
    rol: { type: String, enum: ["admin", "empleado_tienda", "empleado_stock"], required: true }
});

// Manual hashing since we might findOneAndUpdate
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

// Check if model already exists to avoid overwrite error if running multiple times/contexts
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function resetUsers() {
    try {
        await mongoose.connect(mongoURI);
        console.log('✅ Conectado a MongoDB');

        const usersToReset = [
            { username: "dueno", passwordPlain: "admin123", nombre: "Dueño", rol: "admin" },
            { username: "tienda", passwordPlain: "tienda123", nombre: "Vendedor Tienda", rol: "empleado_tienda" }
        ];

        for (const u of usersToReset) {
            const hashedPassword = await hashPassword(u.passwordPlain);

            const result = await User.findOneAndUpdate(
                { username: u.username },
                {
                    password: hashedPassword,
                    nombre: u.nombre,
                    rol: u.rol
                },
                { upsert: true, new: true, runValidators: true }
            );

            console.log(`✅ Usuario actualizado/creado: "${u.username}" | Password: "${u.passwordPlain}" | Rol: "${u.rol}"`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Desconectado');
    }
}

resetUsers();
