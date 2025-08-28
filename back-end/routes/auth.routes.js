import express from "express";
import { loginUsuario, registrarUsuario } from "../controllers/user.controller.js";

const router = express.Router();

// Registro y login
router.post("/register", registrarUsuario);
router.post("/login", loginUsuario);

export default router;
