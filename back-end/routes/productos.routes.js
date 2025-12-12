import express from "express";
import { listarProductos, actualizarProducto, eliminarProducto, crearProducto, obtenerCategorias, uploadImage, obtenerProducto } from "../controllers/productoTienda.controller.js";

const router = express.Router();

router.post("/", uploadImage, crearProducto);
router.get("/", listarProductos);
router.get("/categorias", obtenerCategorias);
router.get("/:id", obtenerProducto);
router.put("/:id", uploadImage, actualizarProducto);
router.delete("/:id", eliminarProducto);

export default router;
