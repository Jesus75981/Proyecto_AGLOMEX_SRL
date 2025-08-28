import express from "express";
import User from "../models/user.model.js";

const router = express.Router();

// Listar usuarios
router.get("/", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Eliminar usuario
router.delete("/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "Usuario eliminado" });
});

export default router;
