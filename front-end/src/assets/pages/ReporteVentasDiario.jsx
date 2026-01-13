import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

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

const ReportesDiarios = ({ userRole }) => {
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
  const [ventas, setVentas] = useState([]);
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('ventas'); // 'ventas' or 'compras'

  const handleFetchVentas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/ventas/reporte-diario', {
        method: 'POST',
        body: JSON.stringify({ date: fecha })
      });
      setVentas(response.data);
    } catch (err) {
      setError('No se pudo obtener el reporte de ventas. Por favor, intente de nuevo.');
      console.error(err);
      if (err.message.includes('Token no válido') || err.message.includes('403') || err.message.includes('Forbidden')) {
        alert('Sesión expirada. Redirigiendo al login.');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

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

  const handleGenerateReport = () => {
    if (reportType === 'ventas') {
      handleFetchVentas();
    } else {
      handleFetchCompras();
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
            <h1 className="text-4xl font-bold text-purple-600 mb-2">Reporte Diario</h1>
            <p className="text-gray-600 text-lg">Análisis detallado de ventas y compras diarias</p>
          </div>

          {/* "Book" container */}
          <div className="bg-white rounded-xl shadow-lg mb-6">
            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => setReportType('ventas')}
                className={`py-4 px-6 font-semibold text-lg ${reportType === 'ventas' ? 'border-b-2 border-purple-600 text-purple-700' : 'text-gray-500 hover:text-purple-600'}`}
              >
                Ventas
              </button>
              <button
                onClick={() => setReportType('compras')}
                className={`py-4 px-6 font-semibold text-lg ${reportType === 'compras' ? 'border-b-2 border-blue-600 text-blue-700' : 'text-gray-500 hover:text-blue-600'}`}
              >
                Compras
              </button>
            </div>

            {/* Form */}
            <div className="p-6">
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
                  onClick={handleGenerateReport}
                  disabled={!fecha || loading}
                  className={`px-6 py-2 text-white font-semibold rounded-lg shadow-md transition duration-300 disabled:bg-gray-400 ${reportType === 'ventas' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {loading ? 'Cargando...' : `Generar Reporte de ${reportType === 'ventas' ? 'Ventas' : 'Compras'}`}
                </button>
              </div>
            </div>
          </div>

          {error && <div className="text-red-500 text-center mb-4 bg-red-50 p-4 rounded-lg">{error}</div>}

          {/* Ventas Report */}
          {reportType === 'ventas' && (
            ventas.length > 0 ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                  <h3 className="text-lg font-semibold text-gray-800">Ventas del día: {new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                  <p className="text-sm text-gray-600">Total de ventas: {ventas.length}</p>
                </div>
                <div className="overflow-x-auto">
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
                        <tr key={venta._id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{venta._id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{venta.cliente}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">${venta.total ? venta.total.toFixed(2) : '0.00'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(venta.fecha).toLocaleDateString('es-ES')}</td>
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
                  Selecciona una fecha para ver el reporte de ventas.
                </p>
              </div>
            )
          )}

          {/* Compras Report */}
          {reportType === 'compras' && (
            compras.length > 0 ? (
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
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportesDiarios;