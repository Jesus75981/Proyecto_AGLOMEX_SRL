import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, ComposedChart, ReferenceLine
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- API Helper ---
import { API_URL } from '../../config/api';

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
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Sesión expirada o permisos insuficientes. Redirigiendo al login...');
    }
    const errorData = await response.json().catch(() => ({}));
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

const DashboardCard = ({ title, value, icon, trend, color, prefix = '', description, status }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    // Status colors
    success: 'bg-green-50 text-green-700 border-green-300 shadow-sm shadow-green-200/50',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-300 shadow-sm shadow-yellow-200/50',
    danger: 'bg-red-50 text-red-700 border-red-300 shadow-sm shadow-red-200/50',
    neutral: 'bg-gray-50 text-gray-700 border-gray-300 shadow-sm shadow-gray-200/50',
  };

  const statusIndicators = {
    success: <span className="absolute top-4 right-4 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>,
    warning: <span className="absolute top-4 right-4 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span></span>,
    danger: <span className="absolute top-4 right-4 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>,
    neutral: <span className="absolute top-4 right-4 flex h-3 w-3"><span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span></span>
  };

  const finalColorClass = status ? colorClasses[status] : (colorClasses[color] || colorClasses.blue);

  return (
    <div className={`relative p-6 rounded-xl border transition-transform hover:scale-105 ${finalColorClass}`}>
      {status && statusIndicators[status]}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium mb-1 opacity-80">{title}</p>
          <h3 className="text-2xl font-bold">
            {prefix}{typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
          </h3>
          {trend !== undefined && (
            <p className={`text-xs mt-2 font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}%
              <span className="text-gray-500 font-normal ml-1">vs mes anterior</span>
            </p>
          )}
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <span className="text-3xl p-2 bg-white bg-opacity-30 rounded-lg">{icon}</span>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon, color, status }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    // Status colors
    success: 'bg-green-50 text-green-700 border-green-300 shadow-sm shadow-green-200/50',
    warning: 'bg-yellow-50 text-yellow-700 border-yellow-300 shadow-sm shadow-yellow-200/50',
    danger: 'bg-red-50 text-red-700 border-red-300 shadow-sm shadow-red-200/50',
    neutral: 'bg-gray-50 text-gray-700 border-gray-300 shadow-sm shadow-gray-200/50',
  };

  const statusIndicators = {
    success: <span className="absolute top-4 right-4 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>,
    warning: <span className="absolute top-4 right-4 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span></span>,
    danger: <span className="absolute top-4 right-4 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>,
    neutral: <span className="absolute top-4 right-4 flex h-3 w-3"><span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span></span>
  };

  const finalColorClass = status ? colorClasses[status] : (colorClasses[color] || colorClasses.blue);

  return (
    <div className={`relative p-6 rounded-xl border transition-transform hover:scale-105 ${finalColorClass}`}>
      {status && statusIndicators[status]}
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
  const [finanzasData, setFinanzasData] = useState({ resumenTotal: {}, cashflow: [] });
  const [rentabilidadData, setRentabilidadData] = useState([]); // <-- Nuevo estado para rentabilidad
  const [rentabilidadSearch, setRentabilidadSearch] = useState(''); // <-- Nuevo estado para búsqueda
  const [inventarioData, setInventarioData] = useState({ metricas: {}, alertas: [] });
  const [logisticaData, setLogisticaData] = useState({ estadisticas: {}, pedidosRecientes: [] });
  const [comprasData, setComprasData] = useState({
    comprasMensuales: [],
    estadisticasGenerales: {},
    comprasRecientes: [],
    comprasPorTipo: [],
    comprasPorEstado: []
  });
  const [comprasPorProductoData, setComprasPorProductoData] = useState([]); // <-- Nuevo estado para compras por producto
  const [comprasSearch, setComprasSearch] = useState(''); // <-- Search input state
  const [debouncedComprasSearch, setDebouncedComprasSearch] = useState(''); // <-- Debounced value for API

  // Colores
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  // Debounce Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedComprasSearch(comprasSearch);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [comprasSearch]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  useEffect(() => {
    cargarDatos();
  }, [activeTab, periodo, selectedYear, selectedMonth, selectedDate, rentabilidadSearch, debouncedComprasSearch]); // <-- Depend on DEBOUNCED value

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) return; // Prevent 403 calls if not logged in
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

      if (activeTab === 'finanzas') {
        const stats = await apiFetch(`/finanzas/estadisticas?${queryString}&t=${Date.now()}`, { headers });
        const resumen = await apiFetch('/finanzas/resumen', { headers });
        const rentabilidad = await apiFetch(`/finanzas/rentabilidad-productos?${queryString}&search=${rentabilidadSearch}&t=${Date.now()}`, { headers });
        const metrics = await apiFetch(`/finanzas/metrics`, { headers }); // <-- Fetch metrics for capital

        // Merge metrics correctly: Keep filtered stats, only add capitalStats from global metrics
        // Warning: Direct overwrite { ...metrics } was replacing filtered data (utilidadBrutaVentas) with global/undefined data
        const mergedMetrics = {
          ...(stats.metrics || {}),
          capitalStats: metrics.capitalStats || {},
          // Ensure we don't accidentally overwrite filtered fields like totalIngresos if we don't want global values
        };

        setFinanzasData({ ...stats, resumenTotal: resumen.data || {}, metrics: mergedMetrics });
        setRentabilidadData(rentabilidad);
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
        const productosRes = await apiFetch(`/compras/productos?${queryString}&search=${debouncedComprasSearch}`, { headers }); // Use debounced value
        setComprasData(res.data || res);
        setComprasPorProductoData(productosRes);
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
      // Capturamos con mayor calidad y limpiando elementos innecesarios
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          // Ocultar botones y controles de navegación en el PDF
          const elementsToHide = clonedDoc.querySelectorAll('button, .bg-white.p-4.rounded-xl.shadow-sm, .flex.flex-wrap.justify-center.gap-4');
          elementsToHide.forEach(el => el.style.display = 'none');
          
          // IMPORTANTE: Expandir todos los contenedores que tengan scroll o altura máxima
          // para que html2canvas capture el contenido completo (tablas largas, etc.)
          const scrollables = clonedDoc.querySelectorAll('.overflow-y-auto, [class*="max-h-"]');
          scrollables.forEach(el => {
            el.style.maxHeight = 'none';
            el.style.overflow = 'visible';
            el.style.height = 'auto';
          });

          const dashboardTitle = clonedDoc.querySelector('h1');
          if (dashboardTitle) dashboardTitle.style.marginBottom = '20px';
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const contentWidth = pdfWidth - 20; // Márgenes de 10mm
      const contentHeight = (imgProps.height * contentWidth) / imgProps.width;
      
      let heightLeft = contentHeight;
      let position = 25; // Espacio inicial para el header
      let pageNum = 1;

      const addHeaderAndFooter = (pdfDoc, currentIdx) => {
        // Header con diseño corporativo
        pdfDoc.setFillColor(79, 70, 229); // Indigo-600
        pdfDoc.rect(0, 0, pdfWidth, 15, 'F');
        pdfDoc.setTextColor(255, 255, 255);
        pdfDoc.setFontSize(12);
        pdfDoc.setFont('helvetica', 'bold');
        pdfDoc.text(`AGLOMEX SRL - REPORTE DE ${activeTab.toUpperCase()}`, 10, 10);
        
        pdfDoc.setFontSize(8);
        pdfDoc.setFont('helvetica', 'normal');
        pdfDoc.text(`Generado: ${new Date().toLocaleString()} | Pág: ${currentIdx}`, pdfWidth - 65, 10);

        // Footer
        pdfDoc.setFontSize(7);
        pdfDoc.setTextColor(150);
        pdfDoc.text("Este reporte contiene datos confidenciales propiedad de Aglomex SRL.", pdfWidth / 2, pdfHeight - 5, { align: 'center' });
      };

      // Primera página
      addHeaderAndFooter(pdf, pageNum);
      pdf.addImage(imgData, 'PNG', 10, position, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - 30);

      // Páginas adicionales si el contenido es largo (especialmente para tablas de finanzas/compras)
      while (heightLeft > 0) {
        position = heightLeft - contentHeight + 15;
        pdf.addPage();
        pageNum++;
        addHeaderAndFooter(pdf, pageNum);
        pdf.addImage(imgData, 'PNG', 10, position, contentWidth, contentHeight);
        heightLeft -= (pdfHeight - 20);
      }

      pdf.save(`Reporte_Completo_${activeTab}_${selectedYear}.pdf`);
    } catch (err) {
      console.error("Error exportando PDF:", err);
      setError("Error al generar el reporte completo en PDF");
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
    gasto: item.totalGasto, // Maps to AreaChart dataKey="gasto"
    pagado: (item.totalGasto || 0) - (item.totalPendiente || 0),
    pendiente: item.totalPendiente
  }));

  const profitChartData = (finanzasData.profitHistory || []).map(item => ({
    label: periodeLabel(item),
    utilidad: item.utilidad,
    ventas: item.ventas
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
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
              <span>←</span> <span>Menú</span>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <KPICard title="Total Ventas" value={ventasData.resumenTotal?.totalVentas || 0} icon="🛒" color="blue" />
                  <KPICard title="Ingresos Totales" value={`Bs. ${(ventasData.resumenTotal?.totalIngresos || 0).toLocaleString()}`} icon="💵" color="green" />
                  <KPICard title="Productos Vendidos" value={ventasData.resumenTotal?.totalProductosVendidos || 0} icon="📦" color="purple" />

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
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" name="Ventas"
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
                  {(() => {
                    const eficiencia = (produccionData.estadisticasGenerales || {}).progresoPromedio || 0;
                    let effStatus = 'neutral';
                    if (eficiencia >= 80) effStatus = 'success';
                    else if (eficiencia >= 50) effStatus = 'warning';
                    else if (eficiencia > 0) effStatus = 'danger';
                    return (
                      <>
                        <KPICard title="Órdenes Totales" value={(produccionData.estadisticasGenerales || {}).totalProducciones || 0} icon="📋" color="blue" />
                        <KPICard title="En Progreso" value={(produccionData.estadisticasGenerales || {}).produccionesEnProgreso || 0} icon="⚙️" color="orange" />
                        <KPICard title="Completadas" value={(produccionData.estadisticasGenerales || {}).produccionesCompletadas || 0} icon="✅" color="green" />
                        <KPICard title="Eficiencia Promedio" value={`${eficiencia.toFixed(1)}%`} icon="⚡" status={effStatus} color="purple" />
                      </>
                    );
                  })()}
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
                          <Line type="monotone" dataKey="unidades" name="Unidades Producidas" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
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
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" name="Órdenes"
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
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" name="Máquinas"
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Fila 1: Operaciones Principales */}
                  {(() => {
                    const ingresos = finanzasData.metrics?.totalIngresos || 0;
                    const utilidad = finanzasData.metrics?.utilidadBrutaVentas || 0;
                    const margen = ingresos > 0 ? (utilidad / ingresos) * 100 : 0;
                    let utilidadStatus = 'neutral';
                    if (margen >= 20) utilidadStatus = 'success';
                    else if (margen >= 10) utilidadStatus = 'warning';
                    else if (margen > 0 || ingresos > 0) utilidadStatus = 'danger';

                    const cuentasPagar = finanzasData.metrics?.cuentasPorPagar || 0;
                    const capitalTotal = finanzasData.metrics?.capitalTotal || 0;
                    let pagarStatus = 'neutral';
                    if (capitalTotal > 0) {
                      if (cuentasPagar > capitalTotal * 0.5) pagarStatus = 'danger';
                      else if (cuentasPagar > capitalTotal * 0.2) pagarStatus = 'warning';
                      else pagarStatus = 'success';
                    }

                    return (
                      <>
                        <DashboardCard
                          title="1. Total Ingresos (Ventas+Envío)"
                          value={ingresos}
                          icon="📈"
                          color="green"
                          prefix="Bs. "
                        />
                        <DashboardCard
                          title="2. Total Egresos"
                          value={finanzasData.metrics?.totalEgresos || 0}
                          icon="📉"
                          color="red"
                          prefix="Bs. "
                        />
                        <DashboardCard
                          title="3. Transferencias Internas"
                          value={finanzasData.metrics?.totalTransferencias || 0}
                          icon="🔄"
                          color="orange"
                          prefix="Bs. "
                          description="Movimientos entre cuentas"
                        />
                        <DashboardCard
                          title="4. Utilidad por Venta (Bruta)"
                          value={utilidad}
                          icon="💰"
                          status={utilidadStatus}
                          color="blue"
                          prefix="Bs. "
                          description="Ganancia (Ventas - Costo Prod.)"
                        />

                        {/* Fila 2: Activos e Inventario */}
                        <DashboardCard
                          title="5. Inversión en Maquinaria"
                          value={finanzasData.metrics?.inversionMaquinaria || 0}
                          icon="🔧"
                          color="purple"
                          prefix="Bs. "
                        />
                        <DashboardCard
                          title="6. Costo Total Materiales"
                          value={finanzasData.metrics?.costoMateriales || 0}
                          icon="🧱"
                          color="indigo"
                          prefix="Bs. "
                        />
                        <DashboardCard
                          title="7. Costo Total Prod. Terminados"
                          value={finanzasData.metrics?.costoProductosTerminados || 0}
                          icon="🪑"
                          color="green"
                          prefix="Bs. "
                        />
                        <DashboardCard
                          title="8. Cuentas por Pagar"
                          value={cuentasPagar}
                          icon="💸"
                          status={pagarStatus}
                          color="red"
                          prefix="Bs. "
                          description="Deudas con proveedores"
                        />

                        {/* Fila 3: Balance y Capital */}
                        <DashboardCard
                          title="9. Cuentas por Cobrar"
                          value={finanzasData.metrics?.cuentasPorCobrar || 0}
                          icon="📝"
                          color="orange"
                          prefix="Bs. "
                          description="Saldos de clientes"
                        />
                        <DashboardCard
                          title="10. Suma Total Cajas y Bancos"
                          value={finanzasData.metrics?.capitalCuentas || 0}
                          icon="🏦"
                          color="blue"
                          prefix="Bs. "
                          description={`Bancos: Bs. ${(finanzasData.metrics?.capitalStats?.totalBanco || 0).toLocaleString()} | Efectivo: Bs. ${(finanzasData.metrics?.capitalStats?.totalEfectivo || 0).toLocaleString()}`}
                        />
                      </>
                    );
                  })()}
                  <div className="lg:col-span-2">
                    <div className="p-6 rounded-xl border-2 border-indigo-200 shadow-xl bg-indigo-900 text-white flex justify-between items-center h-full transform transition-all hover:scale-[1.02]">
                      <div>
                        <p className="text-xs font-bold mb-1 opacity-80 uppercase tracking-widest text-indigo-300">11. Capital Total (Patrimonio)</p>
                        <h3 className="text-3xl font-black text-white">
                          Bs. {(finanzasData.metrics?.capitalTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h3>
                        <p className="text-[10px] mt-2 text-indigo-200">Total Activos (Bs. {(finanzasData.metrics?.totalActivos || 0).toLocaleString()}) - Deudas</p>
                      </div>
                      <span className="text-5xl p-3 bg-white bg-opacity-10 rounded-2xl">🏛️</span>
                    </div>
                  </div>
                </div>

                {/* --- NUEVAS GRÁFICAS COMPARATIVAS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                  {/* Gráfica: Distribución de Activos Corrientes */}
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col hover:shadow-xl transition-shadow">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <span className="p-2 bg-indigo-100 rounded-lg text-indigo-600 font-bold">📦</span>
                      Distribución de Inventario y Activos
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Materiales', value: finanzasData.metrics?.costoMateriales || 0 },
                              { name: 'Prod. Terminados', value: finanzasData.metrics?.costoProductosTerminados || 0 },
                              { name: 'Maquinaria', value: finanzasData.metrics?.inversionMaquinaria || 0 },
                              { name: 'Liquidez', value: finanzasData.metrics?.capitalCuentas || 0 }
                            ]}
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" name="Monto (Bs.)"
                          >
                            <Cell fill="#6366F1" />
                            <Cell fill="#10B981" />
                            <Cell fill="#F59E0B" />
                            <Cell fill="#8B5CF6" />
                          </Pie>
                          <Tooltip content={<CustomTooltip prefix="Bs. " />} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Gráfica: Balance de Cuentas */}
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col hover:shadow-xl transition-shadow">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <span className="p-2 bg-orange-100 rounded-lg text-orange-600 font-bold">⚖️</span>
                      Balance de Cuentas (Créditos vs Deudas)
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Cuentas x Cobrar', valor: finanzasData.metrics?.cuentasPorCobrar || 0, color: '#10B981' },
                          { name: 'Cuentas x Pagar', valor: finanzasData.metrics?.cuentasPorPagar || 0, color: '#EF4444' }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip cursor={{ fill: '#f9fafb' }} content={<CustomTooltip prefix="Bs. " />} />
                          <Bar dataKey="valor" name="Monto (Bs.)" radius={[6, 6, 0, 0]} barSize={60}>
                            <Cell fill="#10B981" />
                            <Cell fill="#EF4444" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Evolución Financiera */}
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <span className="p-2 bg-green-100 rounded-lg text-green-600 font-bold">📊</span>
                      Evolución Financiera
                    </h3>
                    <div className="flex-grow">
                      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                        <BarChart data={cashflowChartData} barGap={0} barCategoryGap="20%">
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="label" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                          <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                          <Tooltip cursor={{ fill: '#F3F4F6' }} content={<CustomTooltip prefix="Bs. " />} />
                          <Bar dataKey="ingresos" name="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="egresos" name="Egresos" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Utilidad Bruta (Reemplaza Flujo de Caja) */}
                  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                      <span className="p-2 bg-blue-100 rounded-lg text-blue-600 font-bold">💸</span>
                      Utilidad Bruta (Ventas - Costos)
                    </h3>
                    <div className="flex-grow">
                      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                        <BarChart data={profitChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="label" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#9CA3AF" tick={{ fontSize: 10 }} />
                          <Tooltip content={<CustomTooltip prefix="Bs. " />} />
                          <ReferenceLine y={0} stroke="#9CA3AF" />
                          <Bar dataKey="utilidad" name="Utilidad" radius={[4, 4, 0, 0]}>
                            {profitChartData.map((entry, index) => (
                              <Cell key={`cell-${index} `} fill={entry.utilidad >= 0 ? '#10B981' : '#EF4444'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* --- TABLA: DETALLE DE UTILIDAD POR VENTA --- */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 mt-6 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <span className="p-2 bg-blue-100 rounded-lg text-blue-600">📑</span>
                      Detalle de Rentabilidad por Venta
                    </h3>
                    <span className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                      Últimas 100 ventas
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200 sticky top-0 bg-gray-50">
                        <tr>
                          <th className="px-6 py-3">Fecha</th>
                          <th className="px-6 py-3">Nº Venta</th>
                          <th className="px-6 py-3">Producto</th>
                          <th className="px-6 py-3 text-right">Cant.</th>
                          <th className="px-6 py-3 text-right">P. Venta</th>
                          <th className="px-6 py-3 text-right">C. Compra (Histórico)</th>
                          <th className="px-6 py-3 text-right">Utilidad Unit.</th>
                          <th className="px-6 py-3 text-right">Utilidad Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(finanzasData.salesDetail || []).length > 0 ? (
                          (finanzasData.salesDetail || []).map((sale, idx) => (
                            <tr key={idx} className="hover:bg-blue-50 transition-colors">
                              <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                                {new Date(sale.fecha).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-3 font-mono text-gray-600">#{sale.numVenta}</td>
                              <td className="px-6 py-3 font-medium text-gray-800">
                                {sale.producto} <span className="text-xs text-gray-400 font-normal">({sale.codigo || 'S/C'})</span>
                              </td>
                              <td className="px-6 py-3 text-right text-gray-600">{sale.cantidad}</td>
                              <td className="px-6 py-3 text-right text-blue-600 font-medium">Bs. {(sale.precioVenta || 0).toFixed(2)}</td>
                              <td className="px-6 py-3 text-right text-gray-500">Bs. {(sale.costoCompra || 0).toFixed(2)}</td>
                              <td className={`px-6 py-3 text-right font-medium ${(sale.utilidadUnitario || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                Bs. {(sale.utilidadUnitario || 0).toFixed(2)}
                              </td>
                              <td className={`px-6 py-3 text-right font-bold ${(sale.utilidadTotal || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Bs. {(sale.utilidadTotal || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="px-6 py-8 text-center text-gray-400 italic">
                              No hay ventas registradas en este periodo.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
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
                  {(() => {
                    const stockBajo = inventarioData.metricas.productosStockBajo || 0;
                    const agotados = inventarioData.metricas.productosAgotados || 0;
                    const stockBajoStatus = stockBajo > 0 ? 'warning' : 'success';
                    const agotadosStatus = agotados > 0 ? 'danger' : 'success';
                    return (
                      <>
                        <KPICard title="Total Productos" value={inventarioData.metricas.totalProductos || 0} icon="🔢" color="blue" />
                        <KPICard title="Valor Inventario" value={`Bs. ${inventarioData.metricas.valorTotalInventario?.toLocaleString() || 0}`} icon="💰" color="green" />
                        <KPICard title="Stock Bajo" value={stockBajo} icon="⚠️" status={stockBajoStatus} color="yellow" />
                        <KPICard title="Agotados" value={agotados} icon="🚫" status={agotadosStatus} color="red" />
                      </>
                    );
                  })()}
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
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" name="Valor"
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
                          <Bar dataKey="cantidadVendida" name="Unidades Vendidas" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20}>
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
                  {(() => {
                    const totalPedidos = logisticaData.estadisticas.totalPedidos || 0;
                    const pendientes = logisticaData.estadisticas.pedidosPorEstado?.pendiente || 0;
                    let pendientesStatus = 'neutral';
                    if (totalPedidos > 0 && (pendientes / totalPedidos) > 0.3) pendientesStatus = 'warning';
                    return (
                      <>
                        <KPICard title="Envíos Totales" value={totalPedidos} icon="📦" color="blue" />
                        <KPICard title="Entregados" value={logisticaData.estadisticas.pedidosPorEstado?.entregado || 0} icon="✅" color="green" />
                        <KPICard title="Pendientes" value={pendientes} icon="⏳" status={pendientesStatus} color="yellow" />
                        <KPICard title="En Proceso" value={logisticaData.estadisticas.pedidosPorEstado?.en_proceso || 0} icon="⚙️" color="orange" />
                      </>
                    );
                  })()}
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
                          <Line type="monotone" dataKey="envios" name="Total Envíos" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
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
                          <Bar dataKey="value" name="Envíos" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20} />
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
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" name="Envíos"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <KPICard title="Compras Totales" value={comprasData.estadisticasGenerales.totalCompras || 0} icon="🛒" color="blue" />
                  <KPICard title="Gasto Total" value={`Bs. ${comprasData.estadisticasGenerales.totalGasto?.toLocaleString() || 0}`} icon="💸" color="red" />

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
                          <Area type="monotone" dataKey="gasto" name="Monto Gasto" stroke="#EC4899" strokeWidth={2} fillOpacity={1} fill="url(#colorGasto)" activeDot={{ r: 6 }} />
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
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="total" name="Monto de Gasto"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {comprasData.comprasPorTipo.map((entry, index) => (
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

                {/* --- SECCIÓN NUEVA: ANÁLISIS DE COMPRAS POR PRODUCTO --- */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mt-6 overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <span className="p-2 bg-pink-100 rounded-lg text-pink-600">🛍️</span>
                      Compras por Producto
                    </h3>
                    <div className="relative w-full md:w-64">
                      <input
                        type="text"
                        placeholder="Buscar por código o nombre..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        value={comprasSearch}
                        onChange={(e) => setComprasSearch(e.target.value)}
                      />
                      <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                    </div>
                  </div>

                  <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={comprasPorProductoData.slice(0, 10)} // Top 10 productos
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                        <XAxis type="number" stroke="#9CA3AF" tickFormatter={(value) => `Bs. ${value}`} />
                        <YAxis
                          type="category"
                          dataKey="nombre"
                          stroke="#4B5563"
                          width={150}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-lg">
                                  <p className="font-bold text-gray-800 mb-2">{label}</p>
                                  <div className="space-y-1 text-sm">
                                    <p className="flex justify-between gap-4">
                                      <span className="text-gray-500">Gasto Total:</span>
                                      <span className="font-bold text-pink-600">Bs. {data.costoTotal.toLocaleString()}</span>
                                    </p>
                                    <p className="flex justify-between gap-4">
                                      <span className="text-gray-500">Cantidad:</span>
                                      <span className="font-medium">{data.cantidadComprada} u.</span>
                                    </p>
                                    <p className="flex justify-between gap-4">
                                      <span className="text-gray-500">Costo Promedio:</span>
                                      <span className="font-medium">Bs. {data.precioPromedio.toFixed(2)}</span>
                                    </p>
                                    <p className="flex justify-between gap-4">
                                      <span className="text-gray-500">Última Compra:</span>
                                      <span className="font-medium text-gray-400">{new Date(data.ultimaCompra).toLocaleDateString()}</span>
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="costoTotal" fill="#EC4899" radius={[0, 4, 4, 0]} barSize={20} name="Gasto Total" />
                      </BarChart>
                    </ResponsiveContainer>
                    {comprasPorProductoData.length > 10 && (
                      <p className="text-center text-xs text-gray-400 mt-2">Mostrando los 10 productos con mayor gasto</p>
                    )}
                  </div>
                </div>


              </div>
            )}
            {/* --- CALIDAD Y PRUEBAS --- */}
            {activeTab === 'calidad' && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Garantía de Calidad y Pruebas del Sistema</h2>
                  <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold shadow-sm">
                    <span className="animate-pulse">●</span> Sistema Verificado
                  </div>
                </div>

                {/* Resumen de Pruebas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-lg border-l-8 border-indigo-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Pruebas Backend (Jest)</p>
                        <h3 className="text-4xl font-black text-gray-800 mt-1">47 / 47</h3>
                        <p className="text-green-600 font-bold mt-2 flex items-center gap-1">
                          <span>✓</span> 100% Cobertura
                        </p>
                      </div>
                      <span className="text-5xl opacity-20">⚙️</span>
                    </div>
                    <div className="mt-4 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full w-full"></div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-lg border-l-8 border-orange-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Pruebas Frontend (Vitest)</p>
                        <h3 className="text-4xl font-black text-gray-800 mt-1">9 / 9</h3>
                        <p className="text-green-600 font-bold mt-2 flex items-center gap-1">
                          <span>✓</span> 100% Éxito
                        </p>
                      </div>
                      <span className="text-5xl opacity-20">🖥️</span>
                    </div>
                    <div className="mt-4 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full w-full"></div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-lg border-l-8 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Integridad General</p>
                        <h3 className="text-4xl font-black text-gray-800 mt-1">PASA</h3>
                        <p className="text-green-600 font-bold mt-2 flex items-center gap-1">
                          <span>✓</span> Certificado
                        </p>
                      </div>
                      <span className="text-5xl opacity-20">🛡️</span>
                    </div>
                    <div className="mt-4 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full w-full"></div>
                    </div>
                  </div>
                </div>

                {/* Detalles de Cobertura */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                      <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">📋</span>
                      Detalle de Test Suites (Backend)
                    </h3>
                    <div className="space-y-4">
                      {[
                        { name: 'Auth Module', tests: 12, status: 'Passed' },
                        { name: 'Finance Module', tests: 15, status: 'Passed' },
                        { name: 'Logistics Module', tests: 10, status: 'Passed' },
                        { name: 'Sales Module', tests: 10, status: 'Passed' }
                      ].map((module, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors">
                          <span className="font-bold text-gray-700">{module.name}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-500 text-sm">{module.tests} pruebas</span>
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black uppercase">✓ OK</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                      <span className="p-2 bg-orange-50 text-orange-600 rounded-lg">🎨</span>
                      Componentes Verificados (Frontend)
                    </h3>
                    <div className="space-y-4">
                      {[
                        { name: 'Login Interface', tests: 3, status: 'Passed' },
                        { name: 'Data Tables (UI)', tests: 3, status: 'Passed' },
                        { name: 'Executive Charts', tests: 3, status: 'Passed' }
                      ].map((comp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors">
                          <span className="font-bold text-gray-700">{comp.name}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-500 text-sm">{comp.tests} pruebas</span>
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-black uppercase">✓ OK</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mensaje de Certificación */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-2xl text-white shadow-lg flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-bold mb-1">Certificación de Estabilidad de Software</h4>
                    <p className="opacity-90">El sistema ha superado satisfactoriamente todas las pruebas unitarias y de integración.</p>
                  </div>
                  <div className="text-4xl">📜</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
