import express from "express";
import connectDB from "./db.js";

const app = express();
app.use(express.json());

// Conectar a Mongo Atlas
connectDB();

// Rutas de prueba
app.get("/", (req, res) => {
  res.send("Servidor funcionando con MongoDB Atlas 🚀");
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
