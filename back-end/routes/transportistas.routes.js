import express from "express";
import {
  crearTransportista,
  listarTransportistas,
  listarTransportistasActivos,
  actualizarTransportista,
  eliminarTransportista,
  obtenerEstadisticasTransportistas,
} from "../controllers/transportistas.controller.js";

const router = express.Router();

// Crear transportista
router.post("/", crearTransportista);

// Listar todos los transportistas
router.get("/", listarTransportistas);

// Listar transportistas activos
router.get("/activos", listarTransportistasActivos);

// Actualizar transportista
router.put("/:id", actualizarTransportista);

// Eliminar transportista (desactivar)
router.delete("/:id", eliminarTransportista);

// Estadísticas
router.get("/estadisticas", obtenerEstadisticasTransportistas);

export default router;
