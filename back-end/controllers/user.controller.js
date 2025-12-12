import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

// Registro
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
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const token = jwt.sign({ id: user._id, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, user });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Error interno del servidor" });
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