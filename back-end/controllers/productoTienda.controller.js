import ProductoTienda from "../models/productoTienda.models.js";

export const crearProducto = async (req, res) => {
  const producto = new ProductoTienda(req.body);
  await producto.save();
  res.status(201).json(producto);
};

export const listarProductos = async (req, res) => {
  const productos = await ProductoTienda.find().populate("proveedor objeto3D");
  res.json(productos);
};

export const actualizarProducto = async (req, res) => {
  const producto = await ProductoTienda.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(producto);
};

export const eliminarProducto = async (req, res) => {
  await ProductoTienda.findByIdAndDelete(req.params.id);
  res.json({ message: "Producto eliminado" });
};
