import { Router } from "express";
import { registrarVenta, listarVentas, getVentasByDay } from "../controllers/ventas.controller.js";

const router = Router();

router.post("/", registrarVenta);
router.get("/", listarVentas);
router.post("/reporte-diario", getVentasByDay);

export default router;
<<<<<<< HEAD
=======

>>>>>>> 9a2f255f3ac6f4964a29357a6eb1d14d6969aa6f
