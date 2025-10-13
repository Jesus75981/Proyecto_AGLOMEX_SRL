import express from "express";
import { crearAnticipo, listarAnticipos, actualizarAnticipo, eliminarAnticipo } from "../controllers/anticipos.controller.js";

const router = express.Router();

router.post("/", crearAnticipo);
router.get("/", listarAnticipos);
router.put("/:id", actualizarAnticipo);
router.delete("/:id", eliminarAnticipo);

export default router;