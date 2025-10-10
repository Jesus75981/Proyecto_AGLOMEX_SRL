// controllers/objetos3d.controller.js
import Objeto3D from "../models/objetos3d.model.js";

// crea registro y encola trabajo
export const crearObjeto3D = async (req, res) => {
  const { producto, sourceImage, prompt } = req.body;
  const obj = await Objeto3D.create({ producto, sourceImage, prompt, status: "queued" });

  // Lógica de encolado: envía trabajo al microservicio (HTTP o cola)
  // Ejemplo simple: fetch al microservicio
  // await fetch(`${process.env.ZERO123_URL}/infer`, { method:"POST", body: JSON.stringify({ id: obj._id, sourceImage, prompt }) });

  res.status(202).json({ id: obj._id });
};

export const getObjeto3D = async (req, res) => {
  const obj = await Objeto3D.findById(req.params.id);
  if (!obj) return res.status(404).json({ error: "No encontrado" });
  res.json(obj);
};

// endpoint para que el microservicio notifique resultado
export const webhookObjeto3D = async (req, res) => {
  const { status, glbUrl, usdzUrl, previewUrl, error, scale, center, dimensions } = req.body;
  const obj = await Objeto3D.findByIdAndUpdate(
    req.params.id,
    { status, glbUrl, usdzUrl, previewUrl, error, scale, center, dimensions },
    { new: true }
  );
  res.json(obj);
};
