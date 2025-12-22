import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, ComposedChart, ReferenceLine
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- API Helper ---
const API_URL = 'http://localhost:5000/api';

const getAuthToken = () => localStorage.getItem('token');

// --- Suppress Recharts Warnings ---
// This suppresses the benign "width(-1)" warnings from Recharts having issues with FLex/Grid initial renders
const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = args[0];
  if (typeof msg === 'string' && (msg.includes('width(-1)') || msg.includes('height(-1)') || msg.includes('minWidth') || msg.includes('minHeight'))) {
    return;
  }
  originalWarn(...args);
};
const originalError = console.error;
console.error = (...args) => {
  const msg = args[0];
  if (typeof msg === 'string' && (msg.includes('width(-1)') || msg.includes('height(-1)') || msg.includes('minWidth') || msg.includes('minHeight'))) {
    return;
  }
  originalError(...args);
};


const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Sesión expirada. Redirigiendo al login...');
    }
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
  const [produccionData, setProduccionData] = useState({ estadisticasGenerales: {}, produccionMensual: [], produccionPorEstado: [], eficienciaProduccion: [], maquinaStats: [] });
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
        const [res, maquinasRes] = await Promise.all([
          apiFetch(`/produccion/estadisticas?${queryString}`, { headers }),
          apiFetch('/maquinas', { headers })
        ]);

        // Calculate machine stats dynamically
        const mStatsMap = maquinasRes.reduce((acc, m) => {
          acc[m.estado] = (acc[m.estado] || 0) + 1;
          return acc;
        }, {});

        const mStats = Object.keys(mStatsMap).map(status => ({
          name: status,
          value: mStatsMap[status]
        }));

        setProduccionData({ ...(res.data || res), maquinaStats: mStats });
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
        const [metricasRes, alertasRes, ventasRes] = await Promise.all([
          apiFetch('/alertas/metricas', { headers }),
          apiFetch('/alertas/stock', { headers }),
          apiFetch(`/ventas/estadisticas?${queryString}`, { headers }) // Fetch sales data for "Productos en Tendencia"
        ]);
        setInventarioData({ metricas: metricasRes, alertas: alertasRes.alertas || [] });
        setVentasData(ventasRes); // Set sales data to populate the chart
      }

      // 5. Logistica
      if (activeTab === 'logistica') {
        const res = await apiFetch(`/logistica/estadisticas?${queryString}`, { headers });
        setLogisticaData(res.data || res);
      }

      // 6. Compras
      if (activeTab === 'compras') {
        const res = await apiFetch(`/compras/estadisticas?${queryString}`, { headers });
        setComprasData(res.data || res);
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
      // Generate canvas with high resolution and clean up UI elements
      const canvas = await html2canvas(element, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          // Hide all buttons (Navigation tabs, Back, Export, Module links) to clean up the report
          const buttons = clonedDoc.querySelectorAll('button');
          buttons.forEach(btn => btn.style.display = 'none');

          // Optional: Add specific print styling to the cloned dashboard-content
          const content = clonedDoc.getElementById('dashboard-content');
          if (content) {
            content.style.padding = '0';
            content.style.boxShadow = 'none';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // -- Header --
      pdf.setFillColor(247, 248, 250); // Light gray header background
      pdf.rect(0, 0, pdfWidth, 25, 'F');

      pdf.setFontSize(20);
      pdf.setTextColor(33, 33, 33);
      pdf.setFont('helvetica', 'bold');
      const title = `Reporte Ejecutivo: ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;
      pdf.text(title, 10, 16);

      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generado el: ${new Date().toLocaleString()} | Año: ${selectedYear}`, 10, 22);

      // -- Footer --
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text("Este documento es un reporte generado automáticamente por el sistema.", pdfWidth / 2, pdfHeight - 10, { align: 'center' });

      // -- Content Image --
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      const imgProps = pdf.getImageProperties(imgData);
      const contentHeight = (imgProps.height * contentWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', margin, 30, contentWidth, contentHeight);

      pdf.save(`Reporte_Dashboard_${activeTab}_${selectedYear}.pdf`);
    } catch (err) {
      console.error("Error exportando PDF:", err);
      setError("Error al exportar el PDF");
    } finally {
      setLoading(false);
    }
  };

  const periodeLabel = (item) => {
    if (!item || !item.period) return '';

    // Period: Year (Monthly view) -> Backend returns { month: 1..12 }
    if (periodo === 'year' || (item.period && item.period.month)) {
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const monthIndex = typeof item.period === 'object' ? item.period.month : item.period;
      if (!monthIndex) return '';
      return monthNames[monthIndex - 1] || '';
    }

    // Period: Month (Daily view) -> Backend returns { day: 1..31 }
    if (periodo === 'month' || (item.period && item.period.day)) {
      return item.period.day ? `${item.period.day}` : '';
    }

    // Period: Day (Hourly view) -> Backend returns { hour: 0..23 }
    if (periodo === 'day' || (item.period && item.period.hour !== undefined)) {
      return `${item.period.hour}:00`;
    }

    return JSON.stringify(item.period);
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

  const formatCashflowLabel = (item) => periodeLabel(item);

  const cashflowChartData = (finanzasData.cashflow || []).map(item => ({
    label: periodeLabel(item),
    ingresos: item.ingresos,
    egresos: item.egresos,
    neto: item.ingresos - item.egresos
  }));

  const comprasChartData = (comprasData.comprasMensuales || []).map(item => ({
    mes: periodeLabel(item),
    pagado: (item.totalGasto || 0) - (item.totalPendiente || 0),
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/home')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
              <span>←</span> Volver
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Ejecutivo</h1>
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            <span>📄</span> Exportar PDF
          </button>
        </div>

        {/* Navigation Tabs */}
        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 max-w-fit mx-auto">
          {['ventas', 'finanzas', 'produccion', 'inventario', 'compras', 'logistica'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl font-semibold transition-all duration-300 transform ${activeTab === tab
                ? 'bg-indigo-600 text-white shadow-lg scale-105'
                : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-indigo-600'
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
                    title="Promedio por Venta"
                    value={`Bs. ${(ventasData.resumenTotal?.totalVentas
                      ? (ventasData.resumenTotal.totalIngresos / ventasData.resumenTotal.totalVentas)
                      : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    icon="📊"
                    color="orange"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-0">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <span className="p-2 bg-blue-100 rounded-lg text-blue-600 font-bold">📊</span>
                      Tendencia de Ingresos
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} debounce={300}>
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
                  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-0">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <span className="p-2 bg-orange-100 rounded-lg text-orange-600 font-bold">📈</span>
                      Producción Mensual
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} debounce={300}>
                        <LineChart data={produccionChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="mes" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="unidades" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-0">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <span className="p-2 bg-purple-100 rounded-lg text-purple-600 font-bold">🥧</span>
                      Estado de Órdenes
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} debounce={300}>
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

                {/* Maquinaria Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-0">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <span className="p-2 bg-gray-100 rounded-lg text-gray-600 font-bold">🔧</span>
                      Estado de Maquinaria
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} debounce={300}>
                        <PieChart>
                          <Pie
                            data={produccionData.maquinaStats}
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                          >
                            {produccionData.maquinaStats.map((entry, index) => {
                              const getColor = (status) => {
                                switch (status) {
                                  case 'Operativa': return '#10B981'; // Green
                                  case 'En mantenimiento': return '#F59E0B'; // Orange
                                  case 'Fuera de servicio': return '#EF4444'; // Red
                                  case 'En revisión': return '#8B5CF6'; // Purple
                                  case 'Necesita reparación': return '#EC4899'; // Pink
                                  default: return COLORS[index % COLORS.length];
                                }
                              };
                              return <Cell key={`cell-${index}`} fill={getColor(entry.name)} />;
                            })}
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

            {/* --- FINANZAS --- */}
            {activeTab === 'finanzas' && (
              <div className="space-y-6 animate-fade-in">
                {/* Top Row: KPI Cards (Barras Arriba) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <KPICard title="Total Ingresos" value={`Bs. ${finanzasData.resumenTotal.ingresos?.toLocaleString() || 0}`} icon="📈" color="green" />
                  <KPICard title="Total Egresos" value={`Bs. ${finanzasData.resumenTotal.egresos?.toLocaleString() || 0}`} icon="📉" color="red" />
                  <KPICard title="Utilidad Neta" value={`Bs. ${(finanzasData.resumenTotal.ingresos - finanzasData.resumenTotal.egresos).toLocaleString() || 0}`} icon="💰" color="blue" />
                  <div className={`p-6 rounded-xl border shadow-sm transition-transform hover:scale-105 ${(finanzasData.resumenTotal.balance || 0) >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-orange-50 border-orange-100'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium mb-1 opacity-80">Balance General</p>
                        <h3 className={`text-2xl font-bold ${(finanzasData.resumenTotal.balance || 0) >= 0 ? 'text-indigo-700' : 'text-orange-700'}`}>
                          Bs. {finanzasData.resumenTotal.balance?.toLocaleString() || 0}
                        </h3>
                      </div>
                      <span className="text-3xl p-2 bg-white bg-opacity-30 rounded-lg">⚖️</span>
                    </div>
                  </div>
                </div>

                {/* Middle Row: Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Financial Evolution (2/3 width) */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span className="p-2 bg-green-100 rounded-lg text-green-600 font-bold">📊</span>
                        Evolución Financiera ({selectedYear})
                      </h3>
                      <div className="flex gap-2 text-sm">
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Ingresos</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Egresos</span>
                      </div>
                    </div>
                    <div className="h-96 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cashflowChartData} barGap={0} barCategoryGap="20%">
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="label" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                          <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                          <Tooltip cursor={{ fill: '#F3F4F6' }} content={<CustomTooltip prefix="Bs. " />} />
                          <Legend iconType="circle" />
                          <Bar dataKey="ingresos" name="Ingresos" fill="url(#colorIngresosBar)" radius={[4, 4, 0, 0]} animationDuration={1000}>
                            <defs>
                              <linearGradient id="colorIngresosBar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#34D399" stopOpacity={1} />
                                <stop offset="100%" stopColor="#10B981" stopOpacity={1} />
                              </linearGradient>
                            </defs>
                          </Bar>
                          <Bar dataKey="egresos" name="Egresos" fill="url(#colorEgresosBar)" radius={[4, 4, 0, 0]} animationDuration={1000}>
                            <defs>
                              <linearGradient id="colorEgresosBar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#F87171" stopOpacity={1} />
                                <stop offset="100%" stopColor="#EF4444" stopOpacity={1} />
                              </linearGradient>
                            </defs>
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right: Cash Flow (1/3 width) - "A lado derecho se vea flujo de caja" */}
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <span className="p-2 bg-blue-100 rounded-lg text-blue-600 font-bold">💸</span>
                      Flujo de Caja Neto
                    </h3>
                    <div className="flex-grow">
                      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                        <BarChart data={cashflowChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="label" stroke="#9CA3AF" tick={{ fontSize: 10 }} interval={0} />
                          <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                          <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg">
                                  <p className="font-bold text-gray-700 mb-1">{payload[0].payload.label}</p>
                                  <p className={`text-sm font-semibold ${payload[0].value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    Neto: Bs. {payload[0].value.toLocaleString()}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                          />
                          <ReferenceLine y={0} stroke="#9CA3AF" />
                          <Bar dataKey="neto" name="Flujo Neto" radius={[4, 4, 0, 0]} animationDuration={1200}>
                            {cashflowChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.neto >= 0 ? '#10B981' : '#EF4444'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-sm text-gray-500 mb-1 text-center">Balance del Período</p>
                      <p className={`text-2xl font-bold text-center ${(finanzasData.resumenTotal.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Bs. {finanzasData.resumenTotal.balance?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
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
                  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-0">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <span className="p-2 bg-blue-100 rounded-lg text-blue-600 font-bold">📊</span>
                      Valor por Categoría
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} debounce={300}>
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
                  </div>
                  {/* Gráfico de Top Stock */}
                  {/* Gráfico de Productos en Tendencia */}
                  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-0">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <span className="p-2 bg-purple-100 rounded-lg text-purple-600 font-bold">🔥</span>
                      Productos en Tendencia
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} debounce={300}>
                        <BarChart data={ventasData.productosMasVendidos || []} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                          <XAxis type="number" stroke="#9CA3AF" />
                          <YAxis dataKey="nombre" type="category" width={120} stroke="#4B5563" tick={{ fontSize: 11 }} />
                          <Tooltip content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-2 border border-blue-100 shadow-lg rounded-lg">
                                  <p className="font-bold text-gray-700">{payload[0].payload.nombre}</p>
                                  <p className="text-sm text-blue-600">Vendidos: {payload[0].value}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                          />
                          <Bar dataKey="cantidadVendida" name="Cantidad" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20}>
                            {
                              (ventasData.productosMasVendidos || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index < 3 ? '#8B5CF6' : '#A78BFA'} />
                              ))
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
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
                  {/* Tendencia de Envíos */}
                  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-0">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <span className="p-2 bg-indigo-100 rounded-lg text-indigo-600 font-bold">📦</span>
                      Tendencia de Envíos
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} debounce={300}>
                        <LineChart data={logisticaChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="label" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="envios" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Envíos por Método */}
                  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-0">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <span className="p-2 bg-purple-100 rounded-lg text-purple-600 font-bold">🚚</span>
                      Envíos por Método
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} debounce={300}>
                        <BarChart data={logisticaData.estadisticas.pedidosPorMetodo || []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                          <XAxis type="number" stroke="#9CA3AF" />
                          <YAxis dataKey="name" type="category" width={100} stroke="#4B5563" tick={{ fontSize: 12 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Estado de Pedidos */}
                  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-0 col-span-1 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <span className="p-2 bg-blue-100 rounded-lg text-blue-600 font-bold">📊</span>
                      Estado de Pedidos
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} debounce={300}>
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
                  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-0">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <span className="p-2 bg-pink-100 rounded-lg text-pink-600 font-bold">📉</span>
                      Gasto Mensual
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} debounce={300}>
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
                  </div>

                  {/* Gráfico de Compras por Tipo */}
                  <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-0">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <span className="p-2 bg-purple-100 rounded-lg text-purple-600 font-bold">🏷️</span>
                      Compras por Tipo
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300} debounce={300}>
                        <PieChart>
                          <Pie
                            data={comprasData.comprasPorTipo}
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
                </div>


              </div>
            )}
          </>
        )}
      </div>
    </div >
  );
};
export default DashboardPage;
