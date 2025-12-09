import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, ComposedChart
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- API Helper ---
const API_URL = 'http://localhost:5000/api';

const getAuthToken = () => localStorage.getItem('token');

const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || errorData.error || 'Error en la petición a la API');
  }
  return response.json();
};

// --- Helper Components ---
const ModuleLink = ({ to, label, icon, color }) => {
  const navigate = useNavigate();
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
    green: 'bg-green-100 text-green-600 hover:bg-green-200',
    purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
    orange: 'bg-orange-100 text-orange-600 hover:bg-orange-200',
    pink: 'bg-pink-100 text-pink-600 hover:bg-pink-200',
    indigo: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200',
    red: 'bg-red-100 text-red-600 hover:bg-red-200',
  };

  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${colorClasses[color] || colorClasses.blue} hover:shadow-sm`}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

const KPICard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
  };

  return (
    <div className={`p-6 rounded-xl border shadow-sm transition-transform hover:scale-105 ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium mb-1 opacity-80">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        <span className="text-3xl p-2 bg-white bg-opacity-30 rounded-lg">{icon}</span>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg">
        <p className="font-semibold text-gray-700 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {prefix}{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
};

const DashboardPage = ({ userRole }) => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // Estados
  const [activeTab, setActiveTab] = useState('ventas');
  const [periodo, setPeriodo] = useState('year'); // 'year', 'month', 'week'
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // For 'week'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Datos
  const [ventasData, setVentasData] = useState({ ventasMensuales: [], ventasAnuales: [], productosMasVendidos: [] });
  const [produccionData, setProduccionData] = useState({ estadisticasGenerales: {}, produccionMensual: [], produccionPorEstado: [], eficienciaProduccion: [] });
  const [finanzasData, setFinanzasData] = useState({ metrics: {}, cashflow: [], resumenTotal: {} });
  const [inventarioData, setInventarioData] = useState({ metricas: {}, alertas: [] });
  const [logisticaData, setLogisticaData] = useState({ estadisticas: {}, pedidosRecientes: [] });
  const [comprasData, setComprasData] = useState({
    comprasMensuales: [],
    estadisticasGenerales: {},
    comprasRecientes: [],
    comprasPorTipo: [],
    comprasPorEstado: []
  });

  // Colores
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  useEffect(() => {
    cargarDatos();
  }, [activeTab, periodo, selectedYear, selectedMonth, selectedDate]);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Construct global query params
      const params = new URLSearchParams({ year: selectedYear, period: periodo });
      if (periodo === 'month') params.append('month', selectedMonth);
      if (periodo === 'week' || periodo === 'day') params.append('date', selectedDate);
      const queryString = params.toString();

      // 1. Ventas
      if (activeTab === 'ventas') {
        const res = await apiFetch(`/ventas/estadisticas?${queryString}`, { headers });
        setVentasData(res);
      }

      // 2. Producción
      if (activeTab === 'produccion') {
        const res = await apiFetch(`/produccion/estadisticas?${queryString}`, { headers });
        setProduccionData(res);
      }

      // 3. Finanzas
      if (activeTab === 'finanzas') {
        const stats = await apiFetch(`/finanzas/estadisticas?${queryString}`, { headers });
        const resumen = await apiFetch('/finanzas/resumen', { headers });
        setFinanzasData({ ...stats, resumenTotal: resumen.data || {} });
      }

      // 4. Inventario
      if (activeTab === 'inventario') {
        // Inventory usually snapshot-based, but we could add params if backend supports history
        const [metricasRes, alertasRes] = await Promise.all([
          apiFetch('/alertas/metricas', { headers }),
          apiFetch('/alertas/stock', { headers })
        ]);
        setInventarioData({ metricas: metricasRes, alertas: alertasRes.alertas || [] });
      }

      // 5. Logistica
      if (activeTab === 'logistica') {
        const res = await apiFetch(`/logistica/estadisticas?${queryString}`, { headers });
        setLogisticaData(res);
      }

      // 6. Compras
      if (activeTab === 'compras') {
        const res = await apiFetch(`/compras/estadisticas?${queryString}`, { headers });
        setComprasData(res);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('dashboard-content');
    try {
      setLoading(true);
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`reporte_dashboard_${activeTab}_${selectedYear}.pdf`);
    } catch (err) {
      console.error("Error exportando PDF:", err);
      setError("Error al exportar el PDF");
    } finally {
      setLoading(false);
    }
  };

  const periodeLabel = (item) => {
    if (periodo === 'year') {
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return monthNames[item.period.month - 1];
    }
    if (periodo === 'month') return item.period.day;
    if (periodo === 'day') return `${item.period.hour}:00`;
    return item.period;
  };

  // Prepare Chart Data
  const ventasChartData = (ventasData.ventasGrafica || []).map(item => ({
    label: periodeLabel(item),
    ingresos: item.totalCobrado,
    pendiente: item.totalPendiente
  }));

  const produccionChartData = (produccionData.produccionMensual || []).map(item => ({
    mes: periodeLabel(item),
    unidades: item.totalProducciones
  }));

  const formatCashflowLabel = (item) => {
    // item.period is { month: 1 } or { day: 5 }
    if (item.period && item.period.month) {
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return monthNames[item.period.month - 1];
    }
    if (item.period && item.period.day) return item.period.day;
    return '';
  };

  const cashflowChartData = (finanzasData.cashflow || []).map(item => ({
    label: formatCashflowLabel(item),
    ingresos: item.ingresos,
    egresos: item.egresos
  }));

  const comprasChartData = (comprasData.comprasMensuales || []).map(item => ({
    mes: periodeLabel(item),
    pagado: item.totalPagado,
    pendiente: item.totalPendiente
  }));

  const logisticaChartData = (logisticaData.estadisticas?.pedidosGrafica || []).map(item => ({
    label: periodeLabel(item),
    envios: item.count,
    costo: item.costoTotal
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8" id="dashboard-content">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Ejecutivo</h1>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            <span>📄</span> Exportar PDF
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['ventas', 'produccion', 'finanzas', 'inventario', 'logistica', 'compras'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Global Period Selection Controls */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['year', 'month', 'week', 'day'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${periodo === p
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {p === 'year' ? 'Anual' : p === 'month' ? 'Mensual' : p === 'week' ? 'Semanal' : 'Diario'}
                </button>
              ))}
            </div>

            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Array.from({ length: 11 }, (_, i) => 2025 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {/* Month Selector */}
            {periodo === 'month' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            )}

            {/* Date Selector (Week/Day) */}
            {(periodo === 'week' || periodo === 'day') && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p className="font-bold">Error al cargar datos</p>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* --- VENTAS --- */}
            {activeTab === 'ventas' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Resumen de Ventas</h2>
                  <ModuleLink to="/ventas" label="Ventas" icon="💰" color="green" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <KPICard title="Total Ventas" value={ventasData.resumenTotal?.totalVentas || 0} icon="🛒" color="blue" />
                  <KPICard title="Ingresos Totales" value={`Bs. ${(ventasData.resumenTotal?.totalIngresos || 0).toLocaleString()}`} icon="💵" color="green" />
                  <KPICard title="Productos Vendidos" value={ventasData.resumenTotal?.totalProductosVendidos || 0} icon="📦" color="purple" />
                  <KPICard
                    title="Ticket Promedio"
                    value={`Bs. ${(ventasData.resumenTotal?.totalVentas
                      ? (ventasData.resumenTotal.totalIngresos / ventasData.resumenTotal.totalVentas)
                      : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon="📊"
                    color="orange"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-4">Tendencia de Ingresos</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={ventasChartData}>
                        <defs>
                          <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="mes" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip content={<CustomTooltip prefix="Bs. " />} />
                        <Area type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorIngresos)" activeDot={{ r: 6 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-4">Top Productos Vendidos</h3>
                    <ResponsiveContainer width="100%" height={300} minHeight={300}>
                      <BarChart data={ventasData.productosMasVendidos || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" stroke="#9CA3AF" />
                        <YAxis dataKey="nombre" type="category" width={100} stroke="#4B5563" tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="cantidad" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Gráfico de Ventas por Categoría - NUEVO */}
                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow col-span-1 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Ventas por Categoría</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                        <PieChart>
                          <Pie
                            data={(ventasData.ventasPorCategoria || []).map(i => ({ name: i._id || 'Sin Categoría', value: i.totalVentas }))}
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                          >
                            {(ventasData.ventasPorCategoria || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip prefix="Bs. " />} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- PRODUCCIÓN --- */}
            {activeTab === 'produccion' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Resumen de Producción</h2>
                  <ModuleLink to="/fabricacion" label="Producción" icon="🏭" color="orange" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <KPICard title="Órdenes Totales" value={(produccionData.estadisticasGenerales || {}).totalProducciones || 0} icon="📋" color="blue" />
                  <KPICard title="En Progreso" value={(produccionData.estadisticasGenerales || {}).produccionesEnProgreso || 0} icon="⚙️" color="orange" />
                  <KPICard title="Completadas" value={(produccionData.estadisticasGenerales || {}).produccionesCompletadas || 0} icon="✅" color="green" />
                  <KPICard title="Eficiencia Promedio" value={`${(produccionData.estadisticasGenerales || {}).progresoPromedio ? (produccionData.estadisticasGenerales || {}).progresoPromedio.toFixed(1) : 0}%`} icon="⚡" color="purple" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-4">Producción Mensual</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={produccionChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="mes" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="unidades" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-4">Estado de Órdenes</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={(produccionData.produccionPorEstado || []).map(i => ({ name: i._id, value: i.count }))}
                          cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                        >
                          {(produccionData.produccionPorEstado || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* --- FINANZAS --- */}
            {activeTab === 'finanzas' && (
              <div className="space-y-6 animate-fade-in">
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">Balance General (Histórico)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-50 p-6 rounded-xl border border-green-100 shadow-sm">
                      <p className="text-sm font-medium text-green-600 mb-1">Total Ingresos</p>
                      <h3 className="text-3xl font-bold text-green-700">Bs. {finanzasData.resumenTotal.ingresos?.toLocaleString() || 0}</h3>
                    </div>
                    <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm">
                      <p className="text-sm font-medium text-red-600 mb-1">Total Egresos</p>
                      <h3 className="text-3xl font-bold text-red-700">Bs. {finanzasData.resumenTotal.egresos?.toLocaleString() || 0}</h3>
                    </div>
                    <div className={`p-6 rounded-xl border shadow-sm ${(finanzasData.resumenTotal.balance || 0) >= 0
                      ? 'bg-blue-50 border-blue-100'
                      : 'bg-orange-50 border-orange-100'
                      }`}>
                      <p className={`text-sm font-medium mb-1 ${(finanzasData.resumenTotal.balance || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
                        }`}>Balance Total</p>
                      <h3 className={`text-3xl font-bold ${(finanzasData.resumenTotal.balance || 0) >= 0 ? 'text-blue-700' : 'text-orange-700'
                        }`}>Bs. {finanzasData.resumenTotal.balance?.toLocaleString() || 0}</h3>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Estadísticas del Año {selectedYear}</h2>
                  <ModuleLink to="/finanzas" label="Detalle Finanzas" icon="💹" color="green" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <KPICard title={`Ingresos ${selectedYear}`} value={`Bs. ${finanzasData.metrics.totalIngresos?.toLocaleString() || 0}`} icon="📈" color="green" />
                  <KPICard title={`Egresos ${selectedYear}`} value={`Bs. ${finanzasData.metrics.totalEgresos?.toLocaleString() || 0}`} icon="📉" color="red" />
                  <KPICard title={`Utilidad ${selectedYear}`} value={`Bs. ${finanzasData.metrics.utilidadNeta?.toLocaleString() || 0}`} icon="💰" color="blue" />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold mb-4">Flujo de Caja</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={cashflowChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="label" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip content={<CustomTooltip prefix="Bs. " />} />
                      <Area type="monotone" dataKey="ingresos" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="egresos" stackId="2" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* --- INVENTARIO --- */}
            {activeTab === 'inventario' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Estado del Inventario</h2>
                  <ModuleLink to="/inventario" label="Inventario" icon="📦" color="indigo" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <KPICard title="Total Productos" value={inventarioData.metricas.totalProductos || 0} icon="🔢" color="blue" />
                  <KPICard title="Valor Inventario" value={`Bs. ${inventarioData.metricas.valorTotalInventario?.toLocaleString() || 0}`} icon="💰" color="green" />
                  <KPICard title="Stock Bajo" value={inventarioData.metricas.productosStockBajo || 0} icon="⚠️" color="yellow" />
                  <KPICard title="Agotados" value={inventarioData.metricas.productosAgotados || 0} icon="🚫" color="red" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico de valor por categoría */}
                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-4">Valor de Inventario por Categoría</h3>
                    <ResponsiveContainer width="100%" height={300} minHeight={300}>
                      <PieChart>
                        <Pie
                          data={(inventarioData.metricas.metricasPorCategoria || []).map(i => ({
                            name: i._id || 'Sin Categoría',
                            value: i.valorTotal || 0
                          }))}
                          cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                        >
                          {(inventarioData.metricas.metricasPorCategoria || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip prefix="Bs. " />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Gráfico de Top Productos con Mayor Stock - NUEVO */}
                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-4">Top Productos con Mayor Stock</h3>
                    <ResponsiveContainer width="100%" height={300} minHeight={300}>
                      <BarChart data={inventarioData.topProductosStock || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" stroke="#9CA3AF" />
                        <YAxis dataKey="nombre" type="category" width={100} stroke="#4B5563" tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#10B981" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* --- LOGÍSTICA --- */}
            {activeTab === 'logistica' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Métricas de Logística</h2>
                  <ModuleLink to="/logistica" label="Logística" icon="🚚" color="blue" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <KPICard title="Envíos Totales" value={logisticaData.estadisticas.totalPedidos || 0} icon="📦" color="blue" />
                  <KPICard title="Entregados" value={logisticaData.estadisticas.pedidosPorEstado?.entregado || 0} icon="✅" color="green" />
                  <KPICard title="Pendientes" value={logisticaData.estadisticas.pedidosPorEstado?.pendiente || 0} icon="⏳" color="yellow" />
                  <KPICard title="En Proceso" value={logisticaData.estadisticas.pedidosPorEstado?.en_proceso || 0} icon="⚙️" color="orange" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-4">Tendencia de Envíos</h3>
                    <ResponsiveContainer width="100%" height={300} minHeight={300}>
                      <LineChart data={logisticaChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="label" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="envios" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-4">Envíos por Método</h3>
                    <ResponsiveContainer width="100%" height={300} minHeight={300}>
                      <BarChart data={logisticaData.estadisticas.pedidosPorMetodo || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" stroke="#9CA3AF" />
                        <YAxis dataKey="name" type="category" width={100} stroke="#4B5563" tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow col-span-1 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Estado de Pedidos</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Pendiente', value: logisticaData.estadisticas.pedidosPorEstado?.pendiente || 0 },
                              { name: 'En Proceso', value: logisticaData.estadisticas.pedidosPorEstado?.en_proceso || 0 },
                              { name: 'Entregado', value: logisticaData.estadisticas.pedidosPorEstado?.entregado || 0 },
                              { name: 'Retrasado', value: logisticaData.estadisticas.pedidosPorEstado?.retrasado || 0 }
                            ]}
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                          >
                            {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- COMPRAS --- */}
            {activeTab === 'compras' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Gestión de Compras</h2>
                  <ModuleLink to="/compras" label="Compras" icon="🛍️" color="pink" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <KPICard title="Compras Totales" value={comprasData.estadisticasGenerales.totalCompras || 0} icon="🛒" color="blue" />
                  <KPICard title="Gasto Total" value={`Bs. ${comprasData.estadisticasGenerales.totalGasto?.toLocaleString() || 0}`} icon="💸" color="red" />
                  <KPICard title="Promedio Compra" value={`Bs. ${comprasData.estadisticasGenerales.promedioCompra ? comprasData.estadisticasGenerales.promedioCompra.toFixed(2) : 0}`} icon="📊" color="purple" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico de Gasto Mensual */}
                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-4">Gasto Mensual</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={comprasChartData}>
                        <defs>
                          <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EC4899" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="mes" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip content={<CustomTooltip prefix="Bs. " />} />
                        <Area type="monotone" dataKey="gasto" stroke="#EC4899" strokeWidth={2} fillOpacity={1} fill="url(#colorGasto)" activeDot={{ r: 6 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Gráfico de Compras por Tipo */}
                  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-4">Compras por Tipo</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={comprasData.comprasPorTipo.map(i => ({ name: i._id, value: i.count }))}
                          cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                        >
                          {comprasData.comprasPorTipo.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabla de Compras Recientes */}
                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold mb-4">Compras Recientes</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Compra</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {comprasData.comprasRecientes.length > 0 ? (
                          comprasData.comprasRecientes.map((compra, idx) => (
                            <tr key={idx}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(compra.fecha).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {compra.numCompra}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {compra.proveedor?.nombre || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {compra.tipoCompra}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                Bs. {(compra.total || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${compra.estado === 'Pagada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {compra.estado}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">No hay compras recientes.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
            }
          </>
        )}
      </div >
    </div >
  );
};
export default DashboardPage;
