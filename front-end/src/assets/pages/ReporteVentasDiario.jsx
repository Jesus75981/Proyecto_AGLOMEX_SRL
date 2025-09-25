import React, { useState } from 'react';
import axios from 'axios';

const ReporteVentasDiario = () => {
  const [fecha, setFecha] = useState('');
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetchVentas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:5000/api/ventas/reporte-diario', { date: fecha });
      setVentas(response.data.data);
    } catch (err) {
      setError('No se pudo obtener el reporte de ventas. Por favor, intente de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Reporte de Ventas por Día</h1>
      
      <div className="flex justify-center items-center mb-6 space-x-4">
        <label htmlFor="fecha" className="text-lg">Selecciona una fecha:</label>
        <input
          type="date"
          id="fecha"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          onClick={handleFetchVentas}
          disabled={!fecha || loading}
          className="px-6 py-2 bg-orange-500 text-white font-semibold rounded-md shadow-md hover:bg-orange-600 transition duration-300 disabled:bg-gray-400"
        >
          {loading ? 'Cargando...' : 'Generar Reporte'}
        </button>
      </div>

      {error && <div className="text-red-500 text-center mb-4">{error}</div>}

      {ventas.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-lg shadow-xl p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Venta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ventas.map((venta) => (
                <tr key={venta._id} className="hover:bg-gray-100 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{venta._id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{venta.cliente}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${venta.total.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(venta.fecha).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-500 text-lg mt-10">
          Selecciona una fecha para ver el reporte de ventas.
        </p>
      )}
    </div>
  );
};

export default ReporteVentasDiario;
