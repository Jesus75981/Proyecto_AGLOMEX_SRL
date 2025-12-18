import express from "express";
import * as userCtrl from "../controllers/user.controller.js";

const router = express.Router();

// CRUD Usuarios
router.get("/", userCtrl.getUsers);           // Obtener todos
router.post("/", userCtrl.registrarUsuario);  // Crear nuevo (reusa registrar)
router.put("/:id", userCtrl.updateUser);      // Actualizar
router.delete("/:id", userCtrl.deleteUser);   // Eliminar

export default router;
