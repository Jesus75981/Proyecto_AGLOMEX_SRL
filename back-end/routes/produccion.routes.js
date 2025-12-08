import express from "express";
import { crearProduccion, listarProducciones, confirmarProduccion, iniciarProduccion, getEstadisticasProduccion } from "../controllers/produccion.controller.js";

const router = express.Router();

router.use((req, res, next) => {
    console.log('DEBUG: Request inside produccion.routes.js');
    next();
});

router.post("/", crearProduccion);
router.get("/", listarProducciones);
router.patch("/:id/iniciar", iniciarProduccion);
router.patch("/:id/confirmar", confirmarProduccion);

// Ruta para estadísticas de producción
router.get("/estadisticas", getEstadisticasProduccion);

export default router;
