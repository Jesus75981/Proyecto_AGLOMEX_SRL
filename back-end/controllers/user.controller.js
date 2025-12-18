import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Registro (Público o Admin)
export const registrarUsuario = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ error: `Ya existe un usuario con este ${field} (${err.keyValue[field]}).` });
    }
    res.status(400).json({ error: err.message });
  }
};

// Login
export const loginUsuario = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log(`🔑 Intento de login: Usuario="${username}"`);

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign({ id: user._id, rol: user.rol, nombre: user.nombre }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user });
  } catch (error) {
    console.error('❌ Error en loginUsuario:', error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// === CRUD DE USUARIOS (Para Admin) ===

// Obtener todos los usuarios
export const getUsers = async (req, res) => {
  try {
    // Opcional: Filtrar para no enviar passwords ni otros datos sensibles si no se quiere
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar usuario
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, ...updateData } = req.body;

    // Si se envía password, hay que encriptarlo manualmente si no usamos el pre-save hook correctamente con findByIdAndUpdate
    // El pre-save hook SOLO funciona con .save(), NO con findByIdAndUpdate.
    // Así que si actualizamos password, debemos hashearlo aqui o buscar, modificar y salvar.

    let user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // Actualizar campos básicos
    if (updateData.username) user.username = updateData.username;
    if (updateData.nombre) user.nombre = updateData.nombre;
    if (updateData.rol) user.rol = updateData.rol;

    // Actualizar password si se envió
    if (password && password.trim() !== '') {
      // El hook pre-save se encargará de hashearlo al hacer user.save()
      // SIEMPRE que modifiquemos user.password directamente
      user.password = password;
    }

    await user.save(); // Esto dispara el pre('save') en el modelo si se modificó el password

    res.json({ message: "Usuario actualizado correctamente", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar usuario
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear usuarios de prueba
export const createTestUsers = async (req, res) => {
  try {
    const users = [
      { username: "dueno", password: "admin123", nombre: "Dueño", rol: "admin" },
      { username: "tienda", password: "admin123", nombre: "Vendedor", rol: "empleado_tienda" },
      { username: "stock", password: "admin123", nombre: "Almacenista", rol: "empleado_stock" }
    ];

    for (const user of users) {
      const exists = await User.findOne({ username: user.username });
      if (!exists) {
        await new User(user).save();
      }
    }

    res.status(201).json({ message: "Usuarios de prueba creados" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};