// routes/logistica.routes.js
import express from "express";
import {
  crearPedido,
  listarPedidos,
  actualizarEstadoPedido,
  eliminarPedido,
} from "../controllers/logistica.controller.js";

const router = express.Router();

router.post("/", crearPedido);
router.get("/", listarPedidos);
router.patch("/:id", actualizarEstadoPedido); // Usamos PATCH para actualizar parcialmente
router.delete("/:id", eliminarPedido);

export default router;