import express from "express";
import { crearProducto, listarProductos, actualizarProducto, eliminarProducto } from "../controllers/productoTienda.controller.js";

const router = express.Router();

router.post("/", crearProducto);
router.get("/", listarProductos);
router.put("/:id", actualizarProducto);
router.delete("/:id", eliminarProducto);

export default router;
