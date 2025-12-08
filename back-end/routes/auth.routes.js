import express from "express";
import { loginUsuario, registrarUsuario, createTestUsers } from "../controllers/user.controller.js";

const router = express.Router();

// Registro y login
router.post("/register", registrarUsuario);
router.post("/login", loginUsuario);
router.post("/create-test-users", createTestUsers);

export default router;
