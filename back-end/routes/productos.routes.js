import express from "express";
import { listarProductos, actualizarProducto, eliminarProducto, crearProducto, obtenerCategorias, uploadImage, obtenerProducto } from "../controllers/productoTienda.controller.js";

const router = express.Router();

<<<<<<< HEAD
router.post("/", crearProducto);
=======
router.post("/", uploadImage, crearProducto);
router.get("/", listarProductos);
>>>>>>> origin/main
router.get("/categorias", obtenerCategorias);
router.get("/:id", obtenerProducto);
router.put("/:id", uploadImage, actualizarProducto);
router.delete("/:id", eliminarProducto);

export default router;
