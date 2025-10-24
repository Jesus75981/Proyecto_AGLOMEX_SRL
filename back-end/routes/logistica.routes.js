// routes/logistica.routes.js
import express from "express";
import {
  crearPedido,
  listarPedidos,
  actualizarEstadoPedido,
  eliminarPedido,
  actualizarTiempoEstimado,
  notificarRetraso,
  obtenerEstadisticas,
} from "../controllers/logistica.controller.js";

const router = express.Router();

router.post("/", crearPedido);
router.get("/", listarPedidos);
router.patch("/:id", actualizarEstadoPedido); // Usamos PATCH para actualizar parcialmente
router.delete("/:id", eliminarPedido);

// Nuevos endpoints para automatización
router.put("/:id/tiempo-estimado", actualizarTiempoEstimado);
router.post("/:id/notificar-retraso", notificarRetraso);
router.get("/estadisticas", obtenerEstadisticas);

export default router;
