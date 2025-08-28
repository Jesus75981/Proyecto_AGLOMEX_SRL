import express from "express";
import { crearMaterial, listarMateriales, actualizarMaterial, eliminarMaterial } from "../controllers/materiales.controller.js";

const router = express.Router();

router.post("/", crearMaterial);
router.get("/", listarMateriales);
router.put("/:id", actualizarMaterial);
router.delete("/:id", eliminarMaterial);

export default router;
