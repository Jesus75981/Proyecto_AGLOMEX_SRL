import express from "express";
import { obtenerPedidoPorNumero, confirmarRecepcionPedido } from "../controllers/pedidos.controller.js";

const router = express.Router();

// Rutas públicas para recepción de pedidos (sin autenticación)
router.get("/numero/:numero", obtenerPedidoPorNumero);
router.post("/confirmar-recepcion", confirmarRecepcionPedido); // Ahora acepta nombre, telefono, ciudad

export default router;
