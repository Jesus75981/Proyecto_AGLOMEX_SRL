import express from "express";
import { crearCliente, listarClientes, actualizarCliente, eliminarCliente } from "../controllers/clientes.controller.js";

const router = express.Router();

router.post("/", crearCliente);
router.get("/", listarClientes);
router.put("/:id", actualizarCliente);
router.delete("/:id", eliminarCliente);

export default router;
