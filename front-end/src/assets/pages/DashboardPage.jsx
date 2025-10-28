import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

// --- API Helper ---
const API_URL = 'http://localhost:5000/api';

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

const DashboardPage = ({ userRole }) => {
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

  const [activeTab, setActiveTab] = useState('ventas');
  const [ventasData, setVentasData] = useState({
    ventasMensuales: [],
    ventasAnuales: [],
    productosMasVendidos: []
  });
  const [produccionData, setProduccionData] = useState({
    estadisticasGenerales: {},
    produccionMensual: [],
    produccionPorEstado: [],
    eficienciaProduccion: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Cargar datos de ventas
  const cargarDatosVentas = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/ventas/estadisticas?year=${selectedYear}`);
      setVentasData(response.data);
    } catch (err) {
      setError('Error al cargar datos de ventas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos de producción
  const cargarDatosProduccion = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/produccion/estadisticas?year=${selectedYear}`);
      setProduccionData(response.data);
    } catch (err) {
      setError('Error al cargar datos de producción');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos de finanzas
  const cargarDatosFinanzas = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/finanzas/metrics`);
      // Aquí puedes agregar lógica para procesar datos financieros si es necesario
      console.log('Datos financieros:', response);
    } catch (err) {
      setError('Error al cargar datos de finanzas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos de inventario
  const cargarDatosInventario = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/alertas/metricas`);
      // Aquí puedes agregar lógica para procesar datos de inventario si es necesario
      console.log('Datos de inventario:', response);
    } catch (err) {
      setError('Error al cargar datos de inventario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar y cuando cambie el año
  useEffect(() => {
    if (activeTab === 'ventas') {
      cargarDatosVentas();
    } else if (activeTab === 'produccion') {
      cargarDatosProduccion();
    } else if (activeTab === 'finanzas') {
      cargarDatosFinanzas();
    } else if (activeTab === 'inventario') {
      cargarDatosInventario();
    }
  }, [activeTab, selectedYear]);

  // Colores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Preparar datos para gráficos de ventas
  const ventasMensualesChart = ventasData.ventasMensuales.map(item => ({
    mes: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
    ventas: item.totalVentas,
    ingresos: item.totalIngresos,
    productos: item.productosVendidos
  }));

  const productosVendidosChart = ventasData.productosMasVendidos.map(item => ({
    nombre: item.nombre.length > 15 ? item.nombre.substring(0, 15) + '...' : item.nombre,
    vendido: item.totalVendido,
    ingresos: item.totalIngresos
  }));

  // Preparar datos para gráficos de producción
  const produccionMensualChart = produccionData.produccionMensual.map(item => ({
    mes: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
    producciones: item.totalProducciones,
    unidades: item.unidadesProducidas
  }));

  const produccionEstadoChart = produccionData.produccionPorEstado.map(item => ({
    name: item._id,
    value: item.count,
    unidades: item.unidadesTotales
  }));

  const eficienciaChart = produccionData.eficienciaProduccion.map(item => ({
    nombre: item.nombre.length > 15 ? item.nombre.substring(0, 15) + '...' : item.nombre,
    eficiencia: Math.round(item.eficiencia),
    estimado: item.tiempoEstimado,
    real: item.tiempoTranscurrido
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={volverAlHome}
                className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-200"
              >
                <span>←</span>
                <span>Volver al Home</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Sistema Aglomex</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Dashboard Ejecutivo</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {userRole || 'Usuario'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-blue-600 mb-2">Dashboard Ejecutivo</h1>
            <p className="text-gray-600 text-lg">Análisis completo de ventas y producción</p>
          </div>

          {/* Selector de Año */}
          <div className="mb-6 flex justify-center">
            <div className="flex items-center space-x-4">
              <label className="text-lg font-medium text-gray-700">Año:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={2023}>2023</option>
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
              </select>
            </div>
          </div>

          {/* Pestañas */}
          <div className="bg-white rounded-xl shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {['ventas', 'produccion', 'finanzas', 'inventario'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📊 {tab === 'ventas' ? 'Análisis de Ventas' :
                        tab === 'produccion' ? 'Análisis de Producción' :
                        tab === 'finanzas' ? 'Análisis Financiero' :
                        'Análisis de Inventario'}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {error && <div className="text-red-500 text-center mb-4 bg-red-50 p-4 rounded-lg">{error}</div>}

          {/* Contenido de Ventas */}
          {activeTab === 'ventas' && (
            <div className="space-y-6">
              {/* Métricas de Ventas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Total Ventas</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {ventasData.ventasAnuales.reduce((sum, item) => sum + item.totalVentas, 0)}
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <span className="text-green-600 text-xl">💰</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Total Ingresos</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        Bs. {ventasData.ventasAnuales.reduce((sum, item) => sum + item.totalIngresos, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <span className="text-blue-600 text-xl">📈</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Productos Vendidos</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {ventasData.ventasAnuales.reduce((sum, item) => sum + item.productosVendidos, 0)}
                      </p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <span className="text-purple-600 text-xl">📦</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Promedio Mensual</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        Bs. {ventasData.ventasMensuales.length > 0 ?
                          (ventasData.ventasAnuales.reduce((sum, item) => sum + item.totalIngresos, 0) / ventasData.ventasMensuales.length).toLocaleString() :
                          '0'}
                      </p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <span className="text-orange-600 text-xl">📊</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráficos de Ventas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ventas Mensuales */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Ventas Mensuales</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={ventasMensualesChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [
                        name === 'ingresos' ? `Bs. ${value.toLocaleString()}` : value,
                        name === 'ingresos' ? 'Ingresos' : name === 'ventas' ? 'Ventas' : 'Productos'
                      ]} />
                      <Legend />
                      <Area type="monotone" dataKey="ingresos" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="ventas" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Productos Más Vendidos */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Productos Más Vendidos</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productosVendidosChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, 'Unidades']} />
                      <Legend />
                      <Bar dataKey="vendido" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Contenido de Producción */}
          {activeTab === 'produccion' && (
            <div className="space-y-6">
              {/* Métricas de Producción */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Total Producciones</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {produccionData.estadisticasGenerales.totalProducciones || 0}
                      </p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-lg">
                      <span className="text-orange-600 text-xl">🏭</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Completadas</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {produccionData.estadisticasGenerales.produccionesCompletadas || 0}
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <span className="text-green-600 text-xl">✅</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Unidades Producidas</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {produccionData.estadisticasGenerales.totalUnidadesProducidas || 0}
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <span className="text-blue-600 text-xl">📦</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Eficiencia Promedio</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {produccionData.estadisticasGenerales.tiempoPromedioEstimado && produccionData.estadisticasGenerales.tiempoPromedioReal ?
                          Math.round((produccionData.estadisticasGenerales.tiempoPromedioEstimado / produccionData.estadisticasGenerales.tiempoPromedioReal) * 100) :
                          0}%
                      </p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <span className="text-purple-600 text-xl">⚡</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráficos de Producción */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Producción Mensual */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Producción Mensual</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={produccionMensualChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="producciones" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="unidades" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Producción por Estado */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Distribución por Estado</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={produccionEstadoChart}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {produccionEstadoChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Eficiencia de Producción */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Eficiencia por Producción</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={eficienciaChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value}%`, 'Eficiencia']} />
                      <Legend />
                      <Bar dataKey="eficiencia" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Resumen General */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Resumen Ejecutivo</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Producciones Activas:</span>
                      <span className="font-semibold text-blue-600">
                        {produccionData.estadisticasGenerales.produccionesEnProgreso || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Producciones Pendientes:</span>
                      <span className="font-semibold text-yellow-600">
                        {produccionData.estadisticasGenerales.produccionesPendientes || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Producciones Retrasadas:</span>
                      <span className="font-semibold text-red-600">
                        {produccionData.estadisticasGenerales.produccionesRetrasadas || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Tiempo Promedio Estimado:</span>
                      <span className="font-semibold text-purple-600">
                        {produccionData.estadisticasGenerales.tiempoPromedioEstimado ?
                          `${produccionData.estadisticasGenerales.tiempoPromedioEstimado.toFixed(1)}h` :
                          'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contenido de Finanzas */}
          {activeTab === 'finanzas' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Análisis Financiero</h3>
                <p className="text-gray-600">Funcionalidad de análisis financiero próximamente disponible.</p>
              </div>
            </div>
          )}

          {/* Contenido de Inventario */}
          {activeTab === 'inventario' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Análisis de Inventario</h3>
                <p className="text-gray-600">Funcionalidad de análisis de inventario próximamente disponible.</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Cargando datos...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
