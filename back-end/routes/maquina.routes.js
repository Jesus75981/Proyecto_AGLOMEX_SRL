import express from "express";
import { crearMaquina, listarMaquinas, actualizarMaquina, eliminarMaquina, agregarMantenimiento } from "../controllers/maquina.controller.js";

const router = express.Router();

router.post("/", crearMaquina);
router.get("/", listarMaquinas);
router.patch("/:id", actualizarMaquina);
router.delete("/:id", eliminarMaquina);
router.post("/:id/mantenimiento", agregarMantenimiento);

export default router;
