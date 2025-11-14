import express from "express";
import { pagarDeuda, listarDeudas } from "../controllers/deuda.controller.js";

const router = express.Router();

router.get("/", listarDeudas);
router.post("/:id/pagar", pagarDeuda);

export default router;
