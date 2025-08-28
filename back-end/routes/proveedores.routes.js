import express from "express";
import { crearProveedor, listarProveedores, actualizarProveedor, eliminarProveedor } from "../controllers/proveedores.controller.js";

const router = express.Router();

router.post("/", crearProveedor);
router.get("/", listarProveedores);
router.put("/:id", actualizarProveedor);
router.delete("/:id", eliminarProveedor);

export default router;
