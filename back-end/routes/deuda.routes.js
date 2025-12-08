import express from "express";
import { pagarDeuda, listarDeudas, listarDeudasVenta, pagarDeudaVenta } from "../controllers/deuda.controller.js";

const router = express.Router();

router.get("/", listarDeudas); // Compras
router.post("/:id/pagar", pagarDeuda); // Pagar compra

// Ventas (Por Cobrar)
router.get("/ventas", listarDeudasVenta);
router.post("/:id/cobrar", pagarDeudaVenta);

export default router;
