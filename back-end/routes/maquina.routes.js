import express from "express";
import { crearMaquina, listarMaquinas, actualizarMaquina, eliminarMaquina } from "../controllers/maquina.controller.js";

const router = express.Router();

router.post("/", crearMaquina);
router.get("/", listarMaquinas);
router.patch("/:id", actualizarMaquina);
router.delete("/:id", eliminarMaquina);

export default router;
