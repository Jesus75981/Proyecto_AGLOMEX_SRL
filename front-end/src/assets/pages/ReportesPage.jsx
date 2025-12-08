import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
    const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
    const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
    const [entidadId, setEntidadId] = useState(''); // Cliente ID o Proveedor ID

    // --- Datos para selectores ---
    const [clientes, setClientes] = useState([]);
    const [proveedores, setProveedores] = useState([]);

    // --- Resultados ---
    const [reporteData, setReporteData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // Para el modal de detalles

    // Cargar clientes y proveedores al inicio
    useEffect(() => {
        const cargarEntidades = async () => {
            try {
                const [clientesData, proveedoresData] = await Promise.all([
                    apiFetch('/clientes'),
                    apiFetch('/proveedores')
                ]);
                setClientes(clientesData);
                setProveedores(proveedoresData);
            } catch (error) {
                console.error('Error cargando entidades:', error);
            }
        };
        cargarEntidades();
    }, []);

    // --- Funciones de Fechas Rápidas ---
    const setHoy = () => {
        const hoy = new Date().toISOString().split('T')[0];
        setFechaInicio(hoy);
        setFechaFin(hoy);
    };

    const setEstaQuincena = () => {
        const hoy = new Date();
        const dia = hoy.getDate();
        const mes = hoy.getMonth();
        const anio = hoy.getFullYear();

        let inicio, fin;

        if (dia <= 15) {
            inicio = new Date(anio, mes, 1);
            fin = new Date(anio, mes, 15);
        } else {
            inicio = new Date(anio, mes, 16);
            fin = new Date(anio, mes + 1, 0); // Último día del mes
        }

        setFechaInicio(inicio.toISOString().split('T')[0]);
        setFechaFin(fin.toISOString().split('T')[0]);
    };

    const setEsteMes = () => {
        const hoy = new Date();
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

        setFechaInicio(inicio.toISOString().split('T')[0]);
        setFechaFin(fin.toISOString().split('T')[0]);
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
                [activeTab === 'ventas' ? 'clienteId' : 'proveedorId']: entidadId || undefined
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

    // --- Renderizado ---
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/home')} className="text-gray-600 hover:text-gray-900">
                            ← Volver
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
                        onClick={() => { setActiveTab('ventas'); setReporteData(null); setEntidadId(''); }}
                    >
                        Reporte de Ventas
                    </button>
                    <button
                        className={`pb-2 px-4 font-semibold ${activeTab === 'compras' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => { setActiveTab('compras'); setReporteData(null); setEntidadId(''); }}
                    >
                        Reporte de Compras
                    </button>
                </div>

                {/* Filtros */}
                <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
                            <input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
                            <input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {activeTab === 'ventas' ? 'Filtrar por Cliente' : 'Filtrar por Proveedor'}
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
                        <button
                            onClick={generarReporte}
                            disabled={loading}
                            className={`w-full py-2 px-4 rounded-lg font-semibold text-white transition ${loading ? 'bg-gray-400' : (activeTab === 'ventas' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700')}`}
                        >
                            {loading ? 'Generando...' : 'Generar Reporte'}
                        </button>
                    </div>

                    {/* Botones Rápidos */}
                    <div className="flex space-x-3 mt-4">
                        <button onClick={setHoy} className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700">Hoy</button>
                        <button onClick={setEstaQuincena} className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700">Esta Quincena</button>
                        <button onClick={setEsteMes} className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700">Este Mes</button>
                    </div>
                </div>

                {/* Resultados */}
                {reporteData && (
                    <div className="space-y-6">
                        {/* Resumen Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Total Transacciones</p>
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
                                        {reporteData.detalles.map((item) => (
                                            <tr key={item._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {new Date(item.fecha).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {activeTab === 'ventas' ? item.numVenta : item.numCompra}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                    {activeTab === 'ventas' ? item.cliente?.nombre || 'Sin Cliente' : item.proveedor?.nombre || 'Sin Proveedor'}
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
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Detalles */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">
                                Detalles de {activeTab === 'ventas' ? 'Venta' : 'Compra'} #{activeTab === 'ventas' ? selectedItem.numVenta : selectedItem.numCompra}
                            </h3>
                            <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Info Principal */}
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-500">Fecha</p>
                                    <p className="font-medium">{new Date(selectedItem.fecha).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">{activeTab === 'ventas' ? 'Cliente' : 'Proveedor'}</p>
                                    <p className="font-medium">
                                        {activeTab === 'ventas' ? selectedItem.cliente?.nombre : selectedItem.proveedor?.nombre}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Estado</p>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${selectedItem.estado === 'Pagada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {selectedItem.estado}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Saldo Pendiente</p>
                                    <p className="font-medium text-orange-600">Bs. {(selectedItem.saldoPendiente || 0).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Productos */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-3">Productos</h4>
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Producto</th>
                                            <th className="px-3 py-2 text-right">Cant.</th>
                                            <th className="px-3 py-2 text-right">Precio Unit.</th>
                                            <th className="px-3 py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {selectedItem.productos.map((p, idx) => (
                                            <tr key={idx}>
                                                <td className="px-3 py-2">{p.producto?.nombre || p.nombreProducto || 'Producto'}</td>
                                                <td className="px-3 py-2 text-right">{p.cantidad}</td>
                                                <td className="px-3 py-2 text-right">Bs. {p.precioUnitario.toFixed(2)}</td>
                                                <td className="px-3 py-2 text-right font-medium">Bs. {(p.cantidad * p.precioUnitario).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Métodos de Pago */}
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-3">Métodos de Pago</h4>
                                <div className="space-y-2">
                                    {selectedItem.metodosPago && selectedItem.metodosPago.length > 0 ? (
                                        selectedItem.metodosPago.map((pago, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded border">
                                                <span className="text-gray-600">{pago.tipo}</span>
                                                <span className="font-medium">Bs. {pago.monto.toFixed(2)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 italic">No hay pagos registrados (Crédito Total)</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
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
