import { Router } from "express";
import { registrarVenta, listarVentas, getVentasByDay } from "../controllers/ventas.controller.js";

const router = Router();

router.post("/", registrarVenta);
router.get("/", listarVentas);
router.post("/reporte-diario", getVentasByDay);

export default router;
