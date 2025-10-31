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
  const [finanzasData, setFinanzasData] = useState({
    metrics: {},
    cashflow: []
  });
  const [inventarioData, setInventarioData] = useState({
    metricas: {},
    alertas: []
  });
  const [logisticaData, setLogisticaData] = useState({
    estadisticas: {},
    pedidosRecientes: []
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
      const [metricsResponse, cashflowResponse] = await Promise.all([
        apiFetch(`/finanzas/metrics`),
        apiFetch(`/finanzas/cashflow?period=month`)
      ]);
      setFinanzasData({
        metrics: metricsResponse,
        cashflow: cashflowResponse
      });
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
      const [metricasResponse, alertasResponse] = await Promise.all([
        apiFetch(`/alertas/metricas`),
        apiFetch(`/alertas/stock`)
      ]);
      setInventarioData({
        metricas: metricasResponse,
        alertas: alertasResponse.alertas || []
      });
    } catch (err) {
      setError('Error al cargar datos de inventario');
      console.error(err);
  } finally {
    setLoading(false);
  }
};

  // Cargar datos de logistica
  const cargarDatosLogistica = async () => {
    try {
      setLoading(true);
      const [estadisticasResponse, pedidosResponse] = await Promise.all([
        apiFetch(`/logistica/estadisticas`),
        apiFetch(`/logistica`).then(pedidos => pedidos.slice(0, 5)) // últimos 5 pedidos
      ]);
      setLogisticaData({
        estadisticas: estadisticasResponse,
        pedidosRecientes: pedidosResponse
      });
    } catch (err) {
      setError('Error al cargar datos de logística');
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
    } else if (activeTab === 'logistica') {
      cargarDatosLogistica();
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

  // Preparar datos para gráficos de finanzas
  const cashflowChart = finanzasData.cashflow.map(item => ({
    mes: `${item.period.year}-${item.period.month.toString().padStart(2, '0')}`,
    ingresos: item.ingresos,
    egresos: item.egresos,
    flujoNeto: item.flujoNeto
  }));

  // Preparar datos para gráficos de inventario
  const inventarioChart = [
    { name: 'Disponibles', value: inventarioData.metricas.productosDisponibles || 0, color: '#00C49F' },
    { name: 'Stock Bajo', value: inventarioData.metricas.productosStockBajo || 0, color: '#FFBB28' },
    { name: 'Agotados', value: inventarioData.metricas.productosAgotados || 0, color: '#FF8042' }
  ];

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
                {['ventas', 'produccion', 'finanzas', 'inventario', 'logistica'].map((tab) => (
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
                        tab === 'inventario' ? 'Análisis de Inventario' :
                        'Análisis de Logística'}
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
              {/* Métricas Financieras */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Ingresos Totales</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        Bs. {finanzasData.metrics.ingresosTotales?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <span className="text-green-600 text-xl">💰</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Egresos Totales</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        Bs. {finanzasData.metrics.egresosTotales?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-lg">
                      <span className="text-red-600 text-xl">💸</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Flujo Neto</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        Bs. {finanzasData.metrics.flujoNeto?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <span className="text-blue-600 text-xl">📊</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Margen de Ganancia</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {finanzasData.metrics.margenGanancia ? `${finanzasData.metrics.margenGanancia.toFixed(1)}%` : '0%'}
                      </p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <span className="text-purple-600 text-xl">📈</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráficos Financieros */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Flujo de Caja */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Flujo de Caja Mensual</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={cashflowChart}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`Bs. ${value.toLocaleString()}`, '']} />
                      <Legend />
                      <Area type="monotone" dataKey="ingresos" stackId="1" stroke="#00C49F" fill="#00C49F" />
                      <Area type="monotone" dataKey="egresos" stackId="2" stroke="#FF8042" fill="#FF8042" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Resumen Ejecutivo Financiero */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Resumen Ejecutivo Financiero</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Ingresos Promedio Mensual:</span>
                      <span className="font-semibold text-green-600">
                        Bs. {finanzasData.metrics.ingresosPromedioMensual?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Egresos Promedio Mensual:</span>
                      <span className="font-semibold text-red-600">
                        Bs. {finanzasData.metrics.egresosPromedioMensual?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">ROI Anual:</span>
                      <span className="font-semibold text-blue-600">
                        {finanzasData.metrics.roiAnual ? `${finanzasData.metrics.roiAnual.toFixed(1)}%` : '0%'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Estado Financiero:</span>
                      <span className={`font-semibold ${finanzasData.metrics.flujoNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {finanzasData.metrics.flujoNeto >= 0 ? 'Positivo' : 'Negativo'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contenido de Inventario */}
          {activeTab === 'inventario' && (
            <div className="space-y-6">
              {/* Métricas de Inventario */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Productos Disponibles</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {inventarioData.metricas.productosDisponibles || 0}
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <span className="text-green-600 text-xl">📦</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Stock Bajo</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {inventarioData.metricas.productosStockBajo || 0}
                      </p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <span className="text-yellow-600 text-xl">⚠️</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Productos Agotados</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {inventarioData.metricas.productosAgotados || 0}
                      </p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-lg">
                      <span className="text-red-600 text-xl">🚫</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Alertas Activas</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {inventarioData.alertas.length}
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <span className="text-blue-600 text-xl">🔔</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráficos de Inventario */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribución de Inventario */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Distribución de Inventario</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={inventarioChart}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {inventarioChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Alertas de Inventario */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Alertas de Inventario</h3>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {inventarioData.alertas.length > 0 ? (
                      inventarioData.alertas.map((alerta, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{alerta.producto}</p>
                            <p className="text-sm text-gray-600">{alerta.mensaje}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            alerta.tipo === 'agotado' ? 'bg-red-100 text-red-800' :
                            alerta.tipo === 'stock_bajo' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alerta.tipo === 'agotado' ? 'Agotado' :
                             alerta.tipo === 'stock_bajo' ? 'Stock Bajo' :
                             'Alerta'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl">📦</span>
                        <p className="mt-2">No hay alertas activas</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contenido de Logística */}
          {activeTab === 'logistica' && (
            <div className="space-y-6">
              {/* Métricas de Logística */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Total Pedidos</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {logisticaData.estadisticas.totalPedidos || 0}
                      </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <span className="text-blue-600 text-xl">📦</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Pedidos Entregados</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {logisticaData.estadisticas?.pedidosPorEstado?.entregado || 0}
                      </p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <span className="text-green-600 text-xl">✅</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Pedidos en Tránsito</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        {(logisticaData.estadisticas?.pedidosPorEstado?.en_proceso || 0) + (logisticaData.estadisticas?.pedidosPorEstado?.despachado || 0)}
                      </p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <span className="text-yellow-600 text-xl">🚚</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Costo Promedio de Envío</h3>
                      <p className="text-2xl font-bold text-gray-800">
                        Bs. {logisticaData.estadisticas?.totalPedidos > 0 ? (logisticaData.estadisticas.costoTotalEnvios / logisticaData.estadisticas.totalPedidos).toLocaleString() : '0'}
                      </p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <span className="text-purple-600 text-xl">💰</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráficos de Logística */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Estado de Pedidos */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Distribución de Pedidos</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Entregados', value: logisticaData.estadisticas.pedidosEntregados || 0, color: '#00C49F' },
                          { name: 'En Tránsito', value: logisticaData.estadisticas.pedidosEnTransito || 0, color: '#FFBB28' },
                          { name: 'Pendientes', value: logisticaData.estadisticas.pedidosPendientes || 0, color: '#FF8042' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Entregados', value: logisticaData.estadisticas.pedidosEntregados || 0, color: '#00C49F' },
                          { name: 'En Tránsito', value: logisticaData.estadisticas.pedidosEnTransito || 0, color: '#FFBB28' },
                          { name: 'Pendientes', value: logisticaData.estadisticas.pedidosPendientes || 0, color: '#FF8042' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Pedidos Recientes */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Pedidos Recientes</h3>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {logisticaData.pedidosRecientes && logisticaData.pedidosRecientes.length > 0 ? (
                      logisticaData.pedidosRecientes.map((pedido, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">Pedido #{pedido.numeroPedido}</p>
                            <p className="text-sm text-gray-600">{pedido.destino}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            pedido.estado === 'entregado' ? 'bg-green-100 text-green-800' :
                            pedido.estado === 'en_transito' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {pedido.estado === 'entregado' ? 'Entregado' :
                             pedido.estado === 'en_transito' ? 'En Tránsito' :
                             'Pendiente'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl">📦</span>
                        <p className="mt-2">No hay pedidos recientes</p>
                      </div>
                    )}
                  </div>
                </div>
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
