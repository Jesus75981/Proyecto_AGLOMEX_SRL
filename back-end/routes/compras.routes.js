import express from "express";
import { registrarCompra, listarCompras, listarComprasConSaldo } from "../controllers/compras.controller.js";

const router = express.Router();

router.post("/", registrarCompra);
router.get("/", listarCompras);
router.get("/con-saldo", listarComprasConSaldo);

export default router;
