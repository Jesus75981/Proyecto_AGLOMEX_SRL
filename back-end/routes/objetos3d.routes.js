import express from "express";
import { crearObjeto3D, getObjeto3D, webhookObjeto3D } from "../controllers/objetos3d.controller.js";

const router = express.Router();

router.post("/", crearObjeto3D);
router.get("/:id", getObjeto3D);
router.post("/:id/webhook", webhookObjeto3D);

export default router;
