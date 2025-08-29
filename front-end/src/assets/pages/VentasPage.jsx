import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// Se ha eliminado la importación del logo

const VentasPage = () => {
  // Estado para gestionar los datos de la venta y los productos
  const [productosVenta, setProductosVenta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [venta, setVenta] = useState({
    fecha: new Date().toISOString().split("T")[0],
    cliente: "",
    numeroVenta: "001",
    numeroFactura: "",
    metodoPago: [],
  });

  // useEffect para simular la carga de datos de la API
  useEffect(() => {
    // Simulación de carga de datos de productos de tu back-end
    setTimeout(() => {
      const data = [
        { id: 1, cantidad: 2, nombre: "Escritorio de roble", codigo: "E-001", color: "Cafe", costoUnitario: 250, costoTotal: 500 },
        { id: 2, cantidad: 1, nombre: "Librero minimalista", codigo: "L-002", color: "Blanco", costoUnitario: 180, costoTotal: 180 },
      ];
      setProductosVenta(data);
      setLoading(false);
    }, 1000); // Retraso para simular la carga de red
  }, []);

  // Manejadores de eventos para los formularios
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVenta({ ...venta, [name]: value });
  };

  const handlePagoChange = (e) => {
    const { value, checked } = e.target;
    setVenta((prevVenta) => ({
      ...prevVenta,
      metodoPago: checked
        ? [...prevVenta.metodoPago, value]
        : prevVenta.metodoPago.filter((pago) => pago !== value),
    }));
  };

  // Muestra un mensaje de carga mientras se obtienen los datos
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Encabezado fijo sin logo y con botón de volver */}
      <header className="bg-blue-800 text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center">
          {/* Se ha eliminado el espacio del logo */}
          <h1 className="text-2xl font-bold">Aglomex - Registro de Ventas</h1>
        </div>
        <Link
          to="/login"
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
        >
          Volver al Login
        </Link>
      </header>

      <main className="container mx-auto p-6">
        {/* Formulario de registro de venta */}
        <div className="bg-white p-8 rounded-xl shadow-2xl mb-8 border border-blue-200">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b-2 pb-2 border-blue-500">
            Detalles de la Venta
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Fecha
              </label>
              <input
                type="date"
                name="fecha"
                value={venta.fecha}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-gray-50"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Cliente
              </label>
              <input
                type="text"
                name="cliente"
                placeholder="Buscar cliente..."
                value={venta.cliente}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                No. Venta
              </label>
              <input
                type="text"
                name="numeroVenta"
                value={venta.numeroVenta}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 bg-gray-50"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                No. Factura
              </label>
              <input
                type="text"
                name="numeroFactura"
                placeholder="Número de factura..."
                value={venta.numeroFactura}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
          </div>

          <div className="mb-6">
            <span className="block mb-2 text-sm font-semibold text-gray-600">
              Método de Pago
            </span>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="efectivo"
                  value="Efectivo"
                  onChange={handlePagoChange}
                  className="text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">Efectivo</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="transferencia"
                  value="Transferencia"
                  onChange={handlePagoChange}
                  className="text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">Transferencia</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="cheque"
                  value="Cheque"
                  onChange={handlePagoChange}
                  className="text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">Cheque</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="credito"
                  value="Crédito"
                  onChange={handlePagoChange}
                  className="text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-700">Crédito</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="button"
              className="px-6 py-2 font-bold text-white transition duration-200 bg-green-600 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              Registrar Venta
            </button>
          </div>
        </div>

        {/* Tabla de productos de la venta */}
        <div className="bg-white p-8 rounded-xl shadow-2xl border border-blue-200">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b-2 pb-2 border-blue-500">
            Productos
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase rounded-tl-lg">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">
                    Código
                  </th>
                  <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">
                    Color
                  </th>
                  <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase">
                    Costo Unitario
                  </th>
                  <th className="px-6 py-3 text-xs font-bold tracking-wider text-left text-gray-600 uppercase rounded-tr-lg">
                    Costo Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productosVenta.map((producto) => (
                  <tr
                    key={producto.id}
                    className="transition duration-150 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {producto.cantidad}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {producto.nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {producto.codigo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {producto.color}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      ${producto.costoUnitario}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      ${producto.costoTotal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VentasPage;