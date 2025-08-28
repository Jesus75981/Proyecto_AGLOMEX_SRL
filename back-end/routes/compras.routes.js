import express from "express";
import { registrarCompra, listarCompras } from "../controllers/compras.controller.js";

const router = express.Router();

router.post("/", registrarCompra);
router.get("/", listarCompras);

export default router;
