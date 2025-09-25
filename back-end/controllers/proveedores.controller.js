      import Proveedor from "../models/proveedores.model.js";

      export const crearProveedor = async (req, res) => {
        try {
          const proveedor = new Proveedor(req.body);
          await proveedor.save();
          res.status(201).json(proveedor);
        } catch (err) {
          res.status(400).json({ error: err.message });
        }
      };

      export const listarProveedores = async (req, res) => {
       try {
         const proveedores = await Proveedor.find({ activo: true });
          res.json(proveedores);
       } catch (error) {
         res.status(500).json({ error: error.message });
       }
};

      export const actualizarProveedor = async (req, res) => {
        const proveedor = await Proveedor.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(proveedor);
      };

      export const eliminarProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!proveedor) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json({ message: "Proveedor desactivado exitosamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
