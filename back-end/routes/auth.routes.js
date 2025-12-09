import express from "express";
import * as userCtrl from "../controllers/user.controller.js";

const router = express.Router();

// Registro y login
router.post("/register", userCtrl.registrarUsuario);
router.post("/login", userCtrl.loginUsuario);
router.post('/create-test-users', userCtrl.createTestUsers);

export default router;
