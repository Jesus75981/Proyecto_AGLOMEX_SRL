import express from "express";
import { registrarCompra, listarCompras, listarComprasConSaldo, generarReporteCompras, obtenerEstadisticas, obtenerSiguienteNumeroCompra } from "../controllers/compras.controller.js";

const router = express.Router();

router.post("/", registrarCompra);
router.get("/", listarCompras);
router.get("/estadisticas", obtenerEstadisticas);
router.get("/con-saldo", listarComprasConSaldo);
router.get("/siguiente-numero", obtenerSiguienteNumeroCompra);
router.post("/reportes", generarReporteCompras);

export default router;
