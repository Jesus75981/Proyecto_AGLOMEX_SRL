import express from "express";
import { crearPedido, listarPedidos, actualizarEstadoPedido } from "../controllers/pedidos.controller.js";

const router = express.Router();

router.post("/", crearPedido);
router.get("/", listarPedidos);
router.patch("/:id", actualizarEstadoPedido);

export default router;
