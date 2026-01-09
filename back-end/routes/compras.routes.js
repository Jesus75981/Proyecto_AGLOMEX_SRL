import express from "express";
import {
    registrarCompra,
    listarCompras,
    listarComprasConSaldo,
    actualizarCompra,
    obtenerCompraPorId,
    generarReporteCompras,
    obtenerEstadisticas,
    obtenerSiguienteNumeroCompra,
    getComprasPorProducto,
    deleteCompra
} from "../controllers/compras.controller.js";

const router = express.Router();

router.post("/", registrarCompra);
router.get("/", listarCompras);
router.get("/estadisticas", obtenerEstadisticas);
router.get("/productos", getComprasPorProducto); // <-- Nueva ruta
router.get("/con-saldo", listarComprasConSaldo);
router.get("/siguiente-numero", obtenerSiguienteNumeroCompra);
router.post("/reportes", generarReporteCompras);

router.get("/:id", obtenerCompraPorId);
router.put("/:id", actualizarCompra);
router.delete("/:id", deleteCompra);

export default router;
