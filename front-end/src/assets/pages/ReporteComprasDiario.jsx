import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- API Helper ---
import { API_URL } from '../../config/api';

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    throw new Error('Token no válido');
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Token no válido');
    }
    const errorData = await response.json();
    throw new Error(errorData.message || errorData.error || 'Error en la petición a la API');
  }

  return response.json();
};

const ReporteComprasDiario = ({ userRole }) => {
  const navigate = useNavigate();

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const volverAlHome = () => navigate('/home');

  const [fecha, setFecha] = useState('');
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetchCompras = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/ventas/reporte-compras-diario', {
        method: 'POST',
        body: JSON.stringify({ date: fecha })
      });
      setCompras(response.data);
    } catch (err) {
      setError('No se pudo obtener el reporte de compras. Por favor, intente de nuevo.');
      console.error(err);
      if (err.message.includes('Token no válido') || err.message.includes('403') || err.message.includes('Forbidden')) {
        alert('Sesión expirada. Redirigiendo al login.');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <button onClick={volverAlHome} className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition">
              <span>←</span> <span>Menú</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Módulo de Reportes</h1>
          </div>
        </div>
      </nav>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-purple-600 mb-2">Reporte de Compras por Día</h1>
            <p className="text-gray-600 text-lg">Análisis detallado de compras diarias</p>
          </div>

          {/* Report Form */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex justify-center items-center space-x-4">
              <label htmlFor="fecha" className="text-lg font-medium text-gray-700">Selecciona una fecha:</label>
              <input
                type="date"
                id="fecha"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleFetchCompras}
                disabled={!fecha || loading}
                className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition duration-300 disabled:bg-gray-400"
              >
                {loading ? 'Cargando...' : 'Generar Reporte'}
              </button>
            </div>
          </div>

          {error && <div className="text-red-500 text-center mb-4 bg-red-50 p-4 rounded-lg">{error}</div>}

          {compras.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Compras del día: {new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                <p className="text-sm text-gray-600">Total de compras: {compras.length}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Compra</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {compras.map((compra) => (
                      <tr key={compra._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{compra.numCompra}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{compra.proveedor ? compra.proveedor.nombre : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{compra.tipoCompra}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">${compra.total ? compra.total.toFixed(2) : '0.00'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(compra.fecha).toLocaleDateString('es-ES')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">
                Selecciona una fecha para ver el reporte de compras.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReporteComprasDiario;
