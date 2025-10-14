import express from "express";
import { listarProductos, actualizarProducto, eliminarProducto } from "../controllers/productoTienda.controller.js";

const router = express.Router();


router.get("/", listarProductos);
router.put("/:id", actualizarProducto);
router.delete("/:id", eliminarProducto);

export default router;
