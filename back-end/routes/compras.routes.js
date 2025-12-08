import express from "express";
<<<<<<< HEAD
import { registrarCompra, listarCompras, listarComprasConSaldo, actualizarCompra, obtenerCompraPorId } from "../controllers/compras.controller.js";
=======
import { registrarCompra, listarCompras, listarComprasConSaldo, generarReporteCompras, obtenerEstadisticas, obtenerSiguienteNumeroCompra } from "../controllers/compras.controller.js";
>>>>>>> origin/main

const router = express.Router();

router.post("/", registrarCompra);
router.get("/", listarCompras);
router.get("/estadisticas", obtenerEstadisticas);
router.get("/con-saldo", listarComprasConSaldo);
<<<<<<< HEAD
router.get("/:id", obtenerCompraPorId);
router.put("/:id", actualizarCompra);
=======
router.get("/siguiente-numero", obtenerSiguienteNumeroCompra);
router.post("/reportes", generarReporteCompras);
>>>>>>> origin/main

export default router;
