import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ... (code remains same until exportPDF)


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
    }

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Error en la petición a la API');
    }

    return response.json();
};
const ReportesPage = ({ userRole }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('ventas'); // 'ventas' or 'compras'

    // --- Filtros ---
    const [reportPeriod, setReportPeriod] = useState('monthly'); // daily, weekly, monthly, annual, custom
    const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
    const [entidadId, setEntidadId] = useState(''); // Cliente ID o Proveedor ID
    const [productoId, setProductoId] = useState(''); // Nuevo Filtro de Producto

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);

    // --- Datos para selectores ---
    const [clientes, setClientes] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [productos, setProductos] = useState([]);

    // --- Resultados ---
    const [reporteData, setReporteData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // Para el modal de detalles

    // Cargar entidades y productos al inicio
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [clientesData, proveedoresData, productosData] = await Promise.all([
                    apiFetch('/clientes'),
                    apiFetch('/proveedores'),
                    apiFetch('/productos') // Endpoint público o protegido según config
                ]);
                setClientes(clientesData);
                setProveedores(proveedoresData);
                setProductos(productosData);
            } catch (error) {
                console.error('Error cargando datos:', error);
            }
        };
        cargarDatos();
    }, []);

    // --- Manejo de Periodos ---
    const handlePeriodChange = (period) => {
        setReportPeriod(period);
        const hoy = new Date();
        const hoyStr = hoy.toISOString().split('T')[0];
        
        let start = new Date();
        let end = new Date();

        switch (period) {
            case 'daily':
                setFechaInicio(hoyStr);
                setFechaFin(hoyStr);
                break;
            case 'weekly':
                const day = hoy.getDay();
                const diff = hoy.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
                start.setDate(diff);
                end.setDate(start.getDate() + 6);
                setFechaInicio(start.toISOString().split('T')[0]);
                setFechaFin(end.toISOString().split('T')[0]);
                break;
            case 'monthly':
                start = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                end = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
                setFechaInicio(start.toISOString().split('T')[0]);
                setFechaFin(end.toISOString().split('T')[0]);
                break;
            case 'annual':
                start = new Date(hoy.getFullYear(), 0, 1);
                end = new Date(hoy.getFullYear(), 11, 31);
                setFechaInicio(start.toISOString().split('T')[0]);
                setFechaFin(end.toISOString().split('T')[0]);
                break;
            default:
                // Custom: no change dates automatically
                break;
        }
    };

    // --- Generar Reporte ---
    const generarReporte = async () => {
        setLoading(true);
        setReporteData(null);
        try {
            const endpoint = activeTab === 'ventas' ? '/ventas/reportes' : '/compras/reportes';
            const body = {
                fechaInicio,
                fechaFin,
                date: new Date().toISOString(), // Cache buster or explicit date param if needed
                [activeTab === 'ventas' ? 'clienteId' : 'proveedorId']: entidadId || undefined,
                productoId: productoId || undefined,
                searchQuery: searchTerm || undefined
            };

            const data = await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(body)
            });
            setReporteData(data);
        } catch (error) {
            console.error('Error generando reporte:', error);
            alert('Error al generar el reporte: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Exportar PDF ---
    const exportarPDF = () => {
        if (!reporteData) return;

        const doc = new jsPDF();
        const titulo = activeTab === 'ventas' ? 'Reporte Detallado de Ventas' : 'Reporte Detallado de Compras';
        const subtitulo = `Del ${fechaInicio} al ${fechaFin}`;

        // Header
        doc.setFontSize(18);
        doc.text(titulo, 14, 22);
        doc.setFontSize(11);
        doc.text(subtitulo, 14, 30);
        
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 38);

        // Resumen
        autoTable(doc, {
            startY: 45,
            head: [['Concepto', 'Total']],
            body: [
                ['Total Transacciones', activeTab === 'ventas' ? reporteData.resumen.totalVentas : reporteData.resumen.totalCompras],
                [activeTab === 'ventas' ? 'Ingresos Totales' : 'Gastos Totales', `Bs. ${(activeTab === 'ventas' ? reporteData.resumen.totalIngresos : reporteData.resumen.totalGastos).toFixed(2)}`],
                ['Saldo Pendiente Total', `Bs. ${(reporteData.resumen.totalSaldoPendiente || 0).toFixed(2)}`]
            ],
            theme: 'striped',
            headStyles: { fillColor: activeTab === 'ventas' ? [41, 128, 185] : [234, 88, 12] }
        });

        // Tabla Detallada
        // Estructura: Filas Principales (Transacción) y Filas Secundarias (Productos)
        const tableBody = [];

        reporteData.detalles.forEach(item => {
            // 1. Fila de Encabezado de la Transacción
            tableBody.push([{
                content: `${new Date(item.fecha).toLocaleDateString('es-BO', { timeZone: 'UTC' })} - ${activeTab === 'ventas' ? 'Venta' : 'Compra'} #${activeTab === 'ventas' ? item.numVenta : item.numCompra}`,
                colSpan: 2,
                styles: { fontStyle: 'bold', fillColor: [240, 240, 240] }
            }, {
                content: activeTab === 'ventas' ? (item.cliente?.nombre || 'General') : (item.proveedor?.nombre || 'General'),
                styles: { fontStyle: 'bold', fillColor: [240, 240, 240] }
            }, {
                content: item.estado,
                styles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: item.estado === 'Pagada' ? [0, 128, 0] : [200, 100, 0] }
            }, {
                content: `Total: Bs. ${(activeTab === 'ventas' ? item.productos.reduce((s, p) => s + (p.cantidad * p.precioUnitario), 0) : item.totalCompra).toFixed(2)}`,
                colSpan: 2,
                styles: { fontStyle: 'bold', fillColor: [240, 240, 240], halign: 'right' }
            }]);

            // 2. Encabezados de Productos (Sub-tabla)
            tableBody.push([
                { content: 'Código', styles: { fontStyle: 'italic', fontSize: 8, textColor: [100, 100, 100] } },
                { content: 'Producto', styles: { fontStyle: 'italic', fontSize: 8, textColor: [100, 100, 100] } },
                { content: 'Características', styles: { fontStyle: 'italic', fontSize: 8, textColor: [100, 100, 100] } },
                { content: 'Cant.', styles: { fontStyle: 'italic', fontSize: 8, textColor: [100, 100, 100], halign: 'right' } },
                { content: 'P. Unit', styles: { fontStyle: 'italic', fontSize: 8, textColor: [100, 100, 100], halign: 'right' } },
                { content: 'Subtotal', styles: { fontStyle: 'italic', fontSize: 8, textColor: [100, 100, 100], halign: 'right' } }
            ]);

            // 3. Filas de Productos
            item.productos.forEach(p => {
                const productoInfo = p.producto || {};
                const caracteristicas = [
                    productoInfo.color ? `Color: ${productoInfo.color}` : '',
                    productoInfo.marca ? `Marca: ${productoInfo.marca}` : '',
                    productoInfo.dimensiones ? `Dim: ${productoInfo.dimensiones.alto || '?'}x${productoInfo.dimensiones.ancho || '?'}x${productoInfo.dimensiones.profundidad || '?'}` : ''
                ].filter(Boolean).join(', ');

                tableBody.push([
                    productoInfo.codigo || 'S/C',
                    productoInfo.nombre || p.nombreProducto || 'Producto Desconocido',
                    caracteristicas || '-',
                    { content: p.cantidad.toString(), styles: { halign: 'right' } },
                    { content: `Bs. ${p.precioUnitario.toFixed(2)}`, styles: { halign: 'right' } },
                    { content: `Bs. ${(p.cantidad * p.precioUnitario).toFixed(2)}`, styles: { halign: 'right' } }
                ]);
            });

            // Espaciador
            tableBody.push([{ content: '', colSpan: 6, styles: { minCellHeight: 2, fillColor: [255, 255, 255] } }]);
        });

        autoTable(doc, {
            startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 60,
            head: [['Fecha / Cod. Prov.', 'ID / Producto', 'Entidad / Detalle', 'Estado / Cant.', 'Total / P.Unit', 'Saldo / Subtotal']],
            body: tableBody,
            headStyles: { fillColor: activeTab === 'ventas' ? [41, 128, 185] : [234, 88, 12] },
            alternateRowStyles: { fillColor: [255, 255, 255] }, // Disable striping to handle custom rows better
            columnStyles: {
                0: { cellWidth: 25 }, // Código
                1: { cellWidth: 40 }, // Producto
                2: { cellWidth: 40 }, // Características
                3: { cellWidth: 15 }, // Cant
                4: { cellWidth: 25 }, // P. Unit
                5: { cellWidth: 25 }  // Subtotal
            }
        });

        doc.save(`reporte_detallado_${activeTab}_${fechaInicio}_${fechaFin}.pdf`);
    };

    // --- Renderizado ---
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/home')} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                            <span>←</span> <span>Menú</span>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">Reportes Avanzados</h1>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto p-6">
                {/* Tabs */}
                <div className="flex space-x-4 mb-6 border-b border-gray-200">
                    <button
                        className={`pb-2 px-4 font-semibold ${activeTab === 'ventas' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => { 
                            setActiveTab('ventas'); 
                            setReporteData(null); 
                            setEntidadId(''); 
                            setProductoId(''); 
                            setSearchTerm('');
                        }}
                    >
                        Reporte de Ventas
                    </button>
                    <button
                        className={`pb-2 px-4 font-semibold ${activeTab === 'compras' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => { 
                            setActiveTab('compras'); 
                            setReporteData(null); 
                            setEntidadId(''); 
                            setProductoId('');
                            setSearchTerm(''); 
                        }}
                    >
                        Reporte de Compras
                    </button>
                </div>

                {/* Filtros */}
                <div className="bg-white p-6 rounded-xl shadow-md mb-8 space-y-4">
                    
                    {/* Botones de Periodo */}
                    <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-100">
                        {['daily', 'weekly', 'monthly', 'annual', 'custom'].map((p) => (
                            <button
                                key={p}
                                onClick={() => handlePeriodChange(p)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                    reportPeriod === p 
                                    ? (activeTab === 'ventas' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700')
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {p === 'daily' && 'Diario'}
                                {p === 'weekly' && 'Semanal'}
                                {p === 'monthly' && 'Mensual'}
                                {p === 'annual' && 'Anual'}
                                {p === 'custom' && 'Personalizado'}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
                            <input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => { setFechaInicio(e.target.value); setReportPeriod('custom'); }}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
                            <input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => { setFechaFin(e.target.value); setReportPeriod('custom'); }}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        {/* Filtro Entidad */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {activeTab === 'ventas' ? 'Cliente' : 'Proveedor'}
                            </label>
                            <select
                                value={entidadId}
                                onChange={(e) => setEntidadId(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Todos --</option>
                                {activeTab === 'ventas'
                                    ? clientes.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)
                                    : proveedores.map(p => <option key={p._id} value={p._id}>{p.nombre}</option>)
                                }
                            </select>
                        </div>

                        {/* Buscador General (Factura / ID) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {activeTab === 'ventas' ? 'Buscar Factura / ID Venta' : 'Buscar ID Compra'}
                            </label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={activeTab === 'ventas' ? "Ej: 1005 o FAC-001" : "Ej: COMP-2023..."}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                            {/* Custom Searchable Select */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Producto (Opcional)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre o código..."
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pl-10"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setShowProductDropdown(true);
                                            setProductoId(''); // Reset selection on type
                                        }}
                                        onFocus={() => setShowProductDropdown(true)}
                                    />
                                    <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                                    {searchTerm && (
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                setProductoId('');
                                                setShowProductDropdown(false);
                                            }}
                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {showProductDropdown && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {productos
                                            .filter(p => 
                                                p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                p.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                p.idProductoTienda?.toLowerCase().includes(searchTerm.toLowerCase())
                                            )
                                            .map(p => (
                                                <div
                                                    key={p._id}
                                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                                                    onClick={() => {
                                                        setProductoId(p._id);
                                                        setSearchTerm(`${p.nombre} - ${p.codigo}`);
                                                        setShowProductDropdown(false);
                                                    }}
                                                >
                                                    <div className="font-medium text-gray-800">{p.nombre}</div>
                                                    <div className="text-xs text-gray-500 flex justify-between">
                                                        <span>Cod: {p.codigo}</span>
                                                        <span>ID: {p.idProductoTienda?.slice(0, 8)}...</span>
                                                    </div>
                                                </div>
                                            ))}
                                        {productos.filter(p => 
                                            p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            p.idProductoTienda?.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).length === 0 && (
                                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                No se encontraron productos
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                    </div>

                    <button
                        onClick={generarReporte}
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-lg font-bold text-white transition shadow-md ${loading ? 'bg-gray-400' : (activeTab === 'ventas' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700')}`}
                    >
                        {loading ? 'Generando Contenido...' : 'Generar Reporte'}
                    </button>
                </div>

                {/* Resultados */}
                {reporteData && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="flex justify-between items-center">
                             <h2 className="text-xl font-bold text-gray-800">Resultados del Reporte</h2>
                             <button 
                                onClick={exportarPDF}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 shadow-md flex items-center gap-2"
                             >
                                <span className="text-lg">📄</span> Descargar PDF
                             </button>
                        </div>

                        {/* Resumen Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Total {activeTab === 'ventas' ? 'Ventas' : 'Compras'}</p>
                                <p className="text-3xl font-bold text-gray-800">
                                    {activeTab === 'ventas' ? reporteData.resumen.totalVentas : reporteData.resumen.totalCompras}
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">
                                    {activeTab === 'ventas' ? 'Total Ingresos' : 'Total Gastos'}
                                </p>
                                <p className={`text-3xl font-bold ${activeTab === 'ventas' ? 'text-green-600' : 'text-red-600'}`}>
                                    Bs. {(activeTab === 'ventas' ? reporteData.resumen.totalIngresos : reporteData.resumen.totalGastos).toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Saldo Pendiente Total</p>
                                <p className="text-3xl font-bold text-orange-600">
                                    Bs. {reporteData.resumen.totalSaldoPendiente.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Tabla Detallada */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                {activeTab === 'ventas' ? 'Cliente' : 'Proveedor'}
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {reporteData.detalles.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                                    No se encontraron registros con los filtros seleccionados.
                                                </td>
                                            </tr>
                                        ) : (
                                            reporteData.detalles.map((item) => (
                                                <tr key={item._id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(item.fecha).toLocaleDateString('es-BO', { timeZone: 'UTC' })}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {activeTab === 'ventas' ? item.numVenta : item.numCompra}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                        {activeTab === 'ventas' ? (item.cliente?.nombre || 'General') : (item.proveedor?.nombre || 'General')}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                                                        Bs. {(activeTab === 'ventas'
                                                            ? item.productos.reduce((s, p) => s + (p.cantidad * p.precioUnitario), 0)
                                                            : item.totalCompra).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                                                        {item.saldoPendiente > 0 ? `Bs. ${item.saldoPendiente.toFixed(2)}` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.estado === 'Pagada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {item.estado}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <button
                                                            onClick={() => setSelectedItem(item)}
                                                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                                        >
                                                            Ver Detalles
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Detalles */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-up">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h3 className="text-xl font-bold text-gray-800">
                                Detalles de {activeTab === 'ventas' ? 'Venta' : 'Compra'} #{activeTab === 'ventas' ? selectedItem.numVenta : selectedItem.numCompra}
                            </h3>
                            <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Info Principal */}
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div>
                                    <p className="text-sm text-gray-500 uppercase font-bold text-xs">Fecha</p>
                                    <p className="font-medium text-gray-900">{new Date(selectedItem.fecha).toLocaleDateString('es-BO', { timeZone: 'UTC' })}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 uppercase font-bold text-xs">{activeTab === 'ventas' ? 'Cliente' : 'Proveedor'}</p>
                                    <p className="font-medium text-gray-900">
                                        {activeTab === 'ventas' ? selectedItem.cliente?.nombre : selectedItem.proveedor?.nombre}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 uppercase font-bold text-xs">Estado</p>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${selectedItem.estado === 'Pagada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {selectedItem.estado}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 uppercase font-bold text-xs">Saldo Pendiente</p>
                                    <p className="font-medium text-orange-600">Bs. {(selectedItem.saldoPendiente || 0).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Productos */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Productos</h4>
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-3 py-2 text-left rounded-l-lg">Cod. Prov. / ID</th>
                                            <th className="px-3 py-2 text-left">Producto</th>
                                            <th className="px-3 py-2 text-left">Características</th>
                                            <th className="px-3 py-2 text-right">Cant.</th>
                                            <th className="px-3 py-2 text-right">Precio Unit.</th>
                                            <th className="px-3 py-2 text-right rounded-r-lg">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y border-gray-100">
                                        {selectedItem.productos.map((p, idx) => {
                                             const esProductoFiltrado = productoId && (p.producto?._id === productoId || p.producto === productoId);
                                             const productoInfo = p.producto || {};
                                             const caracteristicas = [
                                                 productoInfo.color ? `Color: ${productoInfo.color}` : '',
                                                 productoInfo.marca ? `Marca: ${productoInfo.marca}` : '',
                                                 productoInfo.dimensiones ? `Dim: ${productoInfo.dimensiones.alto || '?'}x${productoInfo.dimensiones.ancho || '?'}x${productoInfo.dimensiones.profundidad || '?'}` : ''
                                             ].filter(Boolean).join(', ');

                                             return (
                                                <tr key={idx} className={esProductoFiltrado ? "bg-yellow-50" : ""}>
                                                    <td className="px-3 py-2 text-xs flex flex-col font-mono">
                                                        <span className="font-bold text-gray-800">{productoInfo.codigo || 'S/C'}</span>
                                                        <span className="text-[10px] text-gray-400 leading-tight">ID: {productoInfo.idProductoTienda || '-'}</span>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            {esProductoFiltrado && <span className="text-yellow-600 font-bold">★</span>}
                                                            {productoInfo.nombre || p.nombreProducto || 'Producto'}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-xs text-gray-500">
                                                        {caracteristicas || '-'}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">{p.cantidad}</td>
                                                    <td className="px-3 py-2 text-right">Bs. {p.precioUnitario.toFixed(2)}</td>
                                                    <td className="px-3 py-2 text-right font-medium">Bs. {(p.cantidad * p.precioUnitario).toFixed(2)}</td>
                                                </tr>
                                             );
                                        })}
                                    </tbody>
                                    <tfoot className="border-t border-gray-100 bg-gray-50">
                                       <tr>
                                           <td colSpan="5" className="px-3 py-2 text-right text-gray-600 text-xs uppercase font-bold">Subtotal:</td>
                                           <td className="px-3 py-2 text-right font-medium">
                                               Bs. {selectedItem.productos.reduce((s, p) => s + (p.cantidad * p.precioUnitario), 0).toFixed(2)}
                                           </td>
                                       </tr>
                                       {selectedItem.descuento > 0 && (
                                           <tr className="text-red-600">
                                               <td colSpan="5" className="px-3 py-1 text-right text-xs uppercase font-bold">Descuento Global:</td>
                                               <td className="px-3 py-1 text-right font-medium">
                                                   - Bs. {selectedItem.descuento.toFixed(2)}
                                               </td>
                                           </tr>
                                       )}
                                       <tr className="bg-green-50">
                                           <td colSpan="5" className="px-3 py-2 text-right text-green-800 text-sm uppercase font-bold">Total Final:</td>
                                           <td className="px-3 py-2 text-right font-bold text-green-700 text-sm">
                                               Bs. {Math.max(0, (selectedItem.productos.reduce((s, p) => s + (p.cantidad * p.precioUnitario), 0) - (selectedItem.descuento || 0))).toFixed(2)}
                                           </td>
                                       </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Métodos de Pago */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">Métodos de Pago</h4>
                                <div className="space-y-2">
                                    {selectedItem.metodosPago && selectedItem.metodosPago.length > 0 ? (
                                        selectedItem.metodosPago.map((pago, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <span className="text-gray-600 font-medium">{pago.tipo}</span>
                                                <span className="font-bold text-gray-800">Bs. {pago.monto.toFixed(2)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic bg-gray-50 p-2 rounded text-center">No hay pagos registrados (Crédito Total)</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end rounded-b-xl">
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportesPage;
