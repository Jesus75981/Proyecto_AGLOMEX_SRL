import express from "express";
import {
    crearRuta,
    listarRutas,
    eliminarRuta
} from "../controllers/ruta.controller.js";

const router = express.Router();

router.post("/", crearRuta);
router.get("/", listarRutas);
router.delete("/:id", eliminarRuta);

export default router;
