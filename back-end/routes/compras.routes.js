import express from "express";
import { registrarCompra, listarCompras, listarComprasConSaldo, actualizarCompra, obtenerCompraPorId } from "../controllers/compras.controller.js";

const router = express.Router();

router.post("/", registrarCompra);
router.get("/", listarCompras);
router.get("/con-saldo", listarComprasConSaldo);
router.get("/:id", obtenerCompraPorId);
router.put("/:id", actualizarCompra);

export default router;
