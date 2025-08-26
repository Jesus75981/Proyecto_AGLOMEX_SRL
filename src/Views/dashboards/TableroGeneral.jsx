import React, { useState } from 'react';

const Dashboard = () => {
  const [ventas, setVentas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [fabricacion, setFabricacion] = useState([]);

  const handleAddVenta = (venta) => {
    setVentas([...ventas, venta]);
  };

  const handleAddCompra = (compra) => {
    setCompras([...compras, compra]);
  };

  const handleAddFabricacion = (producto) => {
    setFabricacion([...fabricacion, producto]);
  };

  return (
    <div>
      <h1>Dashboard Aglomex</h1>
      
      <section>
        <h2>Ventas</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const newVenta = {
            cantidad: e.target.cantidad.value,
            nombreProducto: e.target.nombreProducto.value,
            codigo: e.target.codigo.value,
            color: e.target.color.value,
            costoUnit: e.target.costoUnit.value,
            costoTotal: e.target.costoTotal.value,
          };
          handleAddVenta(newVenta);
          e.target.reset();
        }}>
          <input type="number" name="cantidad" placeholder="Cantidad" required />
          <input type="text" name="nombreProducto" placeholder="Nombre del Producto" required />
          <input type="text" name="codigo" placeholder="Código" required />
          <input type="text" name="color" placeholder="Color" required />
          <input type="number" name="costoUnit" placeholder="Costo Unitario" required />
          <input type="number" name="costoTotal" placeholder="Costo Total" required />
          <button type="submit">Agregar Venta</button>
        </form>
        <ul>
          {ventas.map((venta, index) => (
            <li key={index}>{venta.nombreProducto} - {venta.cantidad}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Compras</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const newCompra = {
            cantidad: e.target.cantidad.value,
            nombreProducto: e.target.nombreProducto.value,
            codigo: e.target.codigo.value,
            color: e.target.color.value,
            costoUnit: e.target.costoUnit.value,
            costoTotal: e.target.costoTotal.value,
          };
          handleAddCompra(newCompra);
          e.target.reset();
        }}>
          <input type="number" name="cantidad" placeholder="Cantidad" required />
          <input type="text" name="nombreProducto" placeholder="Nombre del Producto" required />
          <input type="text" name="codigo" placeholder="Código" required />
          <input type="text" name="color" placeholder="Color" required />
          <input type="number" name="costoUnit" placeholder="Costo Unitario" required />
          <input type="number" name="costoTotal" placeholder="Costo Total" required />
          <button type="submit">Agregar Compra</button>
        </form>
        <ul>
          {compras.map((compra, index) => (
            <li key={index}>{compra.nombreProducto} - {compra.cantidad}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Fabricación</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const newProducto = {
            nombreProducto: e.target.nombreProducto.value,
            codigo: e.target.codigo.value,
            color: e.target.color.value,
            costoUnit: e.target.costoUnit.value,
            costoTotal: e.target.costoTotal.value,
          };
          handleAddFabricacion(newProducto);
          e.target.reset();
        }}>
          <input type="text" name="nombreProducto" placeholder="Nombre del Producto" required />
          <input type="text" name="codigo" placeholder="Código" required />
          <input type="text" name="color" placeholder="Color" required />
          <input type="number" name="costoUnit" placeholder="Costo Unitario" required />
          <input type="number" name="costoTotal" placeholder="Costo Total" required />
          <button type="submit">Agregar Producto</button>
        </form>
        <ul>
          {fabricacion.map((producto, index) => (
            <li key={index}>{producto.nombreProducto} - {producto.codigo}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Dashboard;
