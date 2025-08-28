import express from "express";
import { registrarVenta, listarVentas } from "../controllers/ventas.controller.js";

const router = express.Router();

router.post("/", registrarVenta);
router.get("/", listarVentas);

export default router;
4
