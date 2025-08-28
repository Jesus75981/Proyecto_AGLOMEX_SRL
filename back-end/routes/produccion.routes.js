import express from "express";
import { crearProduccion, listarProducciones, confirmarProduccion } from "../controllers/produccion.controller.js";

const router = express.Router();

router.post("/", crearProduccion);
router.get("/", listarProducciones);
router.patch("/:id/confirmar", confirmarProduccion);

export default router;
