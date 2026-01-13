import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SkeletonMetrics, SkeletonTable, SkeletonCard } from '../../components/Skeleton';
import useDebounce from '../../hooks/useDebounce';

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
  }

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

const LogisticaPage = ({ userRole }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const volverAlHome = () => {
    navigate('/home');
  };

  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('envios');
  const [showForm, setShowForm] = useState(false);
  const [showRetrasoForm, setShowRetrasoForm] = useState(false);
  const [selectedEnvio, setSelectedEnvio] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  // Datos API
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [envios, setEnvios] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingEnvios, setLoadingEnvios] = useState(false);

  // Búsqueda Pedidos
  const [pedidosEncontrados, setPedidosEncontrados] = useState([]);
  const [mostrarDropdownPedidos, setMostrarDropdownPedidos] = useState(false);
  const [busquedaPedido, setBusquedaPedido] = useState('');

  // Transportistas
  const [transportistas, setTransportistas] = useState([]);
  const [nuevoTransportista, setNuevoTransportista] = useState({
    nombre: '', nit: '', contacto: '', telefono: '',
    tipo: 'Terrestre', costoBase: 0, cobertura: [],
    tiempoEntrega: '', observaciones: ''
  });
  const [editingTransportistaId, setEditingTransportistaId] = useState(null);
  const [showTransportistaForm, setShowTransportistaForm] = useState(false);
  const [loadingTransportistas, setLoadingTransportistas] = useState(false);
  const [estadisticasTransportistas, setEstadisticasTransportistas] = useState(null);

  // Rutas
  const [rutas, setRutas] = useState([]);
  const [nuevaRuta, setNuevaRuta] = useState({
    nombre: '', origen: '', destino: '', transportista: ''
  });
  const [loadingRutas, setLoadingRutas] = useState(false);

  // Nuevo Envío State
  const [nuevoEnvio, setNuevoEnvio] = useState({
    pedidoId: '',
    cliente: '',
    calle: '',
    ciudad: '',
    departamento: '',
    pais: 'Bolivia',
    productos: [],
    transportista: '',
    tipoTransporte: 'Terrestre',
    metodoEntrega: 'Envio Domicilio',
    costoEnvio: 0,
    empresaEnvio: ''
  });

  // Filtrado
  const searchTermLower = (debouncedSearchTerm || '').toLowerCase();
  const enviosFiltrados = envios.filter(envio =>
    (envio.cliente?.toLowerCase() || '').includes(searchTermLower) ||
    (envio.pedidoId?.toLowerCase() || '').includes(searchTermLower) ||
    (envio.estado?.toLowerCase() || '').includes(searchTermLower) ||
    (envio.tracking?.toLowerCase() || '').includes(searchTermLower)
  );
  const transportistasFiltrados = transportistas.filter(t => (t.nombre?.toLowerCase() || '').includes(searchTermLower));
  const rutasFiltradas = rutas.filter(r => (r.nombre?.toLowerCase() || '').includes(searchTermLower));

  // Efecto para actualizar estadísticas cuando cambian los envíos
  useEffect(() => {
    if (envios.length > 0) {
      cargarEstadisticas();
    }
  }, [envios]);

  // Funciones
  const cargarEstadisticas = async () => {
    // Mock stats for now
    setEstadisticas({
      periodo: 'mes', totalPedidos: envios.length,
      pedidosPorEstado: {
        pendiente: envios.filter(e => e.estado === 'En almacén').length,
        en_proceso: envios.filter(e => e.estado === 'En tránsito').length,
        despachado: envios.filter(e => e.estado === 'En reparto').length,
        entregado: envios.filter(e => e.estado === 'Entregado').length,
        retrasado: envios.filter(e => e.estado === 'Retrasado').length
      },
      costoTotalEnvios: envios.reduce((sum, e) => sum + e.costoEnvio, 0),
      tiempoPromedioEntrega: 4.2, tasaEntregaExitosa: 87.5
    });
  };

  const cargarTransportistas = async () => {
    setLoadingTransportistas(true);
    try {
      const data = await apiFetch('/transportistas/activos');
      setTransportistas(data);
    } catch (error) {
      console.error('Error cargando transportistas:', error);
    } finally {
      setLoadingTransportistas(false);
    }
  };

  const cargarRutas = async () => {
    setLoadingRutas(true);
    try {
      const data = await apiFetch('/rutas');
      setRutas(data);
    } catch (error) {
      console.error('Error cargando rutas:', error);
    } finally {
      setLoadingRutas(false);
    }
  };

  const cargarEstadisticasTransportistas = async () => {
    try {
      const data = await apiFetch('/transportistas/estadisticas');
      setEstadisticasTransportistas(data);
    } catch (error) {
      console.error('Error stats transportistas:', error);
    }
  };

  const agregarTransportista = async () => {
    if (!nuevoTransportista.nombre.trim()) return alert('Nombre requerido');
    try {
      if (editingTransportistaId) {
        await apiFetch(`/transportistas/${editingTransportistaId}`, {
          method: 'PUT',
          body: JSON.stringify({ ...nuevoTransportista, costoBase: parseFloat(nuevoTransportista.costoBase) })
        });
        alert('✅ Transportista actualizado');
      } else {
        await apiFetch('/transportistas', {
          method: 'POST',
          body: JSON.stringify({ ...nuevoTransportista, costoBase: parseFloat(nuevoTransportista.costoBase) })
        });
        alert('✅ Transportista creado');
      }
      setNuevoTransportista({ nombre: '', nit: '', contacto: '', telefono: '', tipo: 'Terrestre', costoBase: 0, cobertura: [], tiempoEntrega: '', observaciones: '' });
      setEditingTransportistaId(null);
      setShowTransportistaForm(false);
      cargarTransportistas();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const editarTransportista = (t) => {
    setNuevoTransportista({
      nombre: t.nombre,
      nit: t.nit || '',
      contacto: t.contacto,
      telefono: t.telefono,
      tipo: t.tipo,
      costoBase: t.costoBase,
      cobertura: t.cobertura || [],
      tiempoEntrega: t.tiempoEntrega,
      observaciones: t.observaciones || ''
    });
    setEditingTransportistaId(t._id);
    setShowTransportistaForm(true);
  };

  const eliminarTransportista = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este transportista?')) return;
    try {
      await apiFetch(`/transportistas/${id}`, { method: 'DELETE' });
      alert('✅ Transportista eliminado');
      cargarTransportistas();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const buscarPedidos = async (numero) => {
    if (!numero.trim()) {
      setPedidosEncontrados([]);
      setMostrarDropdownPedidos(false);
      return;
    }
    try {
      const pedidosData = await apiFetch('/pedidos');
      const ventasData = await apiFetch('/ventas'); // ✅ Fetch sales too

      const pedidosFiltrados = pedidosData.filter(p => p.pedidoNumero.toString().includes(numero));
      // Map sales to match the structure expected by the dropdown/selection
      const ventasFiltradas = ventasData
        .filter(v => v.numVenta && v.numVenta.toString().includes(numero))
        .map(v => ({
          ...v,
          _id: v._id,
          pedidoNumero: v.numVenta, // Map numVenta to pedidoNumero
          cliente: v.cliente, // Object populated
          productos: v.productos, // List
          metodoEntrega: v.metodoEntrega || "Recojo en Tienda", // Inherit delivery method
          origen: 'Venta' // Flag to know it's a sale
        }));

      const logisticaData = await apiFetch('/logistica');
      const logisticaFiltrados = logisticaData.filter(e => e.pedidoNumero.toString().includes(numero));

      setPedidosEncontrados([...pedidosFiltrados, ...ventasFiltradas, ...logisticaFiltrados]);
      setMostrarDropdownPedidos(true);
    } catch (error) {
      console.error(error);
    }
  };

  const seleccionarPedido = (pedido) => {
    const esRecojo = pedido.metodoEntrega?.toLowerCase().includes('recojo');
    setNuevoEnvio({
      ...nuevoEnvio,
      pedidoId: pedido.pedidoNumero.toString(),
      cliente: pedido.cliente?.nombre || '',
      productos: pedido.productos || [],
      metodoEntrega: pedido.metodoEntrega || 'Envio Domicilio',
      transportista: esRecojo ? 'Cliente' : '',
      empresaEnvio: esRecojo ? 'Cliente' : '',
      costoEnvio: 0
    });
    setBusquedaPedido(pedido.pedidoNumero.toString());
    setMostrarDropdownPedidos(false);
  };

  const cargarEnvios = async () => {
    setLoadingEnvios(true);
    try {
      const data = await apiFetch('/logistica');
      const enviosMapeados = data.map(envio => ({
        id: envio._id,
        pedidoId: `PED-${envio.pedidoNumero}`,
        cliente: envio.cliente?.nombre || 'Cliente no encontrado',
        direccion: `${envio.direccionEnvio?.calle || ''}, ${envio.direccionEnvio?.ciudad || ''}`,
        productos: envio.productos?.map(p => p.producto?.nombre || 'Producto') || [],
        estado: envio.estado === 'en_proceso' ? 'En tránsito' :
          envio.estado === 'despachado' ? 'En reparto' :
            envio.estado === 'entregado' ? 'Entregado' :
              envio.estado === 'cancelado' ? 'Cancelado' :
                envio.estado === 'retrasado' ? 'Retrasado' : 'En almacén',
        transportista: envio.transportista?.nombre || 'Por asignar',
        fechaEnvio: new Date(envio.fechaPedido).toLocaleDateString(),
        fechaEstimada: new Date(envio.fechaEntrega).toLocaleDateString(),
        tiempoEstimado: envio.tiempoEstimado,
        metodoEntrega: envio.metodoEntrega || 'Envio Domicilio',
        costoEnvio: envio.costoEnvio || envio.costoAdicional || 0,
        tracking: `ENV-${envio.pedidoNumero}`,
        ubicacionActual: envio.estado === 'entregado' ? 'Entregado' : 'En proceso',
        empresaEnvio: envio.empresaEnvio || ''
      }));
      setEnvios(enviosMapeados);
    } catch (error) {
      console.error('Error cargando envíos:', error);
    } finally {
      setLoadingEnvios(false);
    }
  };

  const cambiarEstadoEnvioAPI = async (id, nuevoEstado) => {
    try {
      const estadoBackend = nuevoEstado === 'En tránsito' ? 'en_proceso' :
        nuevoEstado === 'En reparto' ? 'despachado' :
          nuevoEstado === 'Entregado' ? 'entregado' : 'pendiente';
      await apiFetch(`/logistica/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: estadoBackend })
      });
      cargarEnvios();
      alert('✅ Estado actualizado');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) return navigate('/login');
      const [pedidosData, clientesData, productosData, bankAccountsData] = await Promise.all([
        apiFetch('/pedidos'), apiFetch('/clientes'), apiFetch('/productos'), apiFetch('/finanzas/cuentas')
      ]);
      setPedidos(pedidosData);
      setClientes(clientesData);
      setProductos(productosData);
      setBankAccounts(bankAccountsData);
      cargarEstadisticas();
      cargarTransportistas();
      cargarEstadisticasTransportistas();
      cargarRutas();
      cargarEnvios();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // ✅ AUTO-DETECTAR PETICIÓN DE ENVÍO DESDE VENTAS
  useEffect(() => {
    const action = searchParams.get('action');
    const pedidoNumero = searchParams.get('pedidoNumero');

    if (action === 'create' && pedidoNumero) {
      const autoCargarPedido = async () => {
        try {


          // 3. Devolver datos poblados para el frontend cargados
          // Asegurar que los datos base estén cargados
          if (pedidos.length === 0 && envios.length === 0) {
            await cargarDatos();
          }

          // Buscar en ventas (ya que el ID viene de una venta)
          const ventasData = await apiFetch('/ventas');
          const ventaEncontrada = ventasData.find(v => v.numVenta && v.numVenta.toString() === pedidoNumero);

          if (ventaEncontrada) {
            // Mapear venta a formato de pedido para logística
            const pedidoMapeado = {
              pedidoNumero: ventaEncontrada.numVenta,
              cliente: ventaEncontrada.cliente, // Objeto completo
              productos: ventaEncontrada.productos,
              metodoEntrega: ventaEncontrada.metodoEntrega
            };

            seleccionarPedido(pedidoMapeado);
            setShowForm(true);
            setBusquedaPedido(pedidoNumero);
          } else {
            // Si no está en ventas, buscar en pedidos normales
            const pedidosData = await apiFetch('/pedidos');
            const pedidoEncontrado = pedidosData.find(p => p.pedidoNumero && p.pedidoNumero.toString() === pedidoNumero);

            if (pedidoEncontrado) {
              seleccionarPedido(pedidoEncontrado);
              setShowForm(true);
              setBusquedaPedido(pedidoNumero);
            }
          }
        } catch (error) {
          console.error("Error auto-cargando pedido:", error);
        }
      };

      autoCargarPedido();
    }
  }, [searchParams]);

  const agregarEnvio = () => {
    if (!nuevoEnvio.pedidoId || !nuevoEnvio.cliente) return;
    // Validación de Cuenta para Costos
    if (nuevoEnvio.costoEnvio > 0 && !nuevoEnvio.cuentaId) {
      alert('⚠️ Para registrar un costo de envío, DEBES seleccionar una Caja o Cuenta de donde saldrá el dinero.');
      return;
    }

    try {
      const datosEnvio = {
        pedidoNumero: parseInt(nuevoEnvio.pedidoId.replace('PED-', '') || Date.now().toString().slice(-6)),
        cliente: clientes.find(c => c.nombre === nuevoEnvio.cliente)?._id,
        productos: nuevoEnvio.productos.map(p => ({
          producto: p.producto?._id || p._id,
          cantidad: p.cantidad || 1
        })),
        fechaEntrega: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        direccionEnvio: {
          calle: nuevoEnvio.calle,
          ciudad: nuevoEnvio.ciudad,
          departamento: nuevoEnvio.departamento,
          pais: nuevoEnvio.pais
        },
        metodoEntrega: nuevoEnvio.metodoEntrega,
        tipoMovimiento: 'Envío a Cliente',
        costoAdicional: 0, // Deprecated in favor of costoEnvio
        costoEnvio: parseFloat(nuevoEnvio.costoEnvio),
        transportista: transportistas.find(t => t.nombre === nuevoEnvio.transportista)?._id,
        empresaEnvio: nuevoEnvio.empresaEnvio
      };

      apiFetch('/logistica', {
        method: 'POST',
        body: JSON.stringify(datosEnvio)
      }).then(() => {
        cargarEnvios();
        alert('✅ Envío programado');
        setNuevoEnvio({
          pedidoId: '', cliente: '', calle: '', ciudad: '', departamento: '', pais: 'Bolivia',
          productos: [], transportista: '', tipoTransporte: 'Terrestre',
          metodoEntrega: 'Envio Domicilio', costoEnvio: 0, empresaEnvio: ''
        });
        setShowForm(false);
      }).catch(err => alert('Error: ' + err.message));
    } catch (error) {
      alert('Error preparando datos: ' + error.message);
    }
  };

  const agregarRuta = async () => {
    if (!nuevaRuta.nombre || !nuevaRuta.transportista) return alert('Nombre y Transportista son requeridos');
    try {
      await apiFetch('/rutas', {
        method: 'POST',
        body: JSON.stringify(nuevaRuta)
      });
      alert('✅ Ruta creada');
      setNuevaRuta({ nombre: '', origen: '', destino: '', transportista: '' });
      setShowForm(false);
      cargarRutas();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const eliminarRuta = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta ruta?')) return;
    try {
      await apiFetch(`/rutas/${id}`, { method: 'DELETE' });
      alert('✅ Ruta eliminada');
      cargarRutas();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // --- NUEVA LÓGICA VENTAS PENDIENTES ---
  const [ventasPendientes, setVentasPendientes] = useState([]);
  const [loadingVentasPendientes, setLoadingVentasPendientes] = useState(false);

  const cargarVentasPendientes = async () => {
    setLoadingVentasPendientes(true);
    try {
      const data = await apiFetch('/logistica/ventas/pendientes');
      setVentasPendientes(data);
    } catch (error) {
      console.error('Error cargando ventas pendientes:', error);
    } finally {
      setLoadingVentasPendientes(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ventas_pendientes') {
      cargarVentasPendientes();
    }
  }, [activeTab]);

  const procesarVentaPendiente = (venta) => {
    // Convertir venta pendiente a formato de envío y abrir formulario
    const pedidoMapeado = {
      pedidoNumero: venta.numVenta,
      cliente: venta.cliente, // Objeto completo
      productos: venta.productos,
      metodoEntrega: venta.metodoEntrega || 'Envio Domicilio'
    };

    // Cambiar a tab de envíos y abrir formulario
    setActiveTab('envios'); // Cambiar a la pestaña de envíos primero

    // Lógica condicional para Ciudad y Departamento
    let defaultCiudad = '';
    let defaultDepartamento = '';

    if (venta.metodoEntrega === 'Envio Domicilio') {
      defaultCiudad = 'Sucre';
      defaultDepartamento = 'Chuquisaca';
    } else {
      // Para Envio Nacional u otros, dejar vacío o usar datos del cliente si tiene
      defaultCiudad = '';
      defaultDepartamento = '';
    }

    // Pre-poblar el estado del formulario "nuevoEnvio" con TODOS los datos disponibles
    setNuevoEnvio({
      pedidoId: venta.numVenta.toString(),
      cliente: venta.cliente?.nombre || '',
      calle: venta.cliente?.direccion || '',
      ciudad: defaultCiudad,
      departamento: defaultDepartamento,
      pais: 'Bolivia',
      productos: venta.productos || [],
      transportista: '',
      tipoTransporte: 'Terrestre',
      metodoEntrega: venta.metodoEntrega || 'Envio Domicilio',
      costoEnvio: 0,
      empresaEnvio: ''
    });

    setShowForm(true);
    setBusquedaPedido(venta.numVenta.toString());
  };
  // ----------------------------------------

  if (loading) return <div className="p-6"><SkeletonMetrics /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button onClick={volverAlHome} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2">
              <span>←</span> <span>Menú</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Sistema Aglomex</h1>
          </div>
          <span className="text-sm text-gray-600">Módulo de Logística</span>
        </div>
      </nav>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-indigo-600 mb-2">Módulo de Logística</h1>
            <p className="text-gray-600 text-lg">Gestión de envíos y distribución</p>
          </div>

          <div className="bg-white rounded-xl shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {['envios', 'ventas_pendientes', 'transportistas', 'rutas'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm capitalize ${activeTab === tab ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {tab === 'envios' ? '🚚 Envíos' :
                      tab === 'ventas_pendientes' ? '🔔 Ventas Pendientes' :
                        tab === 'transportistas' ? '🏢 Transportistas' : '🛣️ Rutas'}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder={`Buscar en ${activeTab === 'ventas_pendientes' ? 'ventas pendientes' : activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {activeTab === 'ventas_pendientes' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4 text-orange-600">Ventas Pendientes</h2>
              <p className="text-gray-600 mb-6">Estas ventas requieren entrega o recojo y aún no tienen logística programada.</p>

              {loadingVentasPendientes ? <SkeletonTable /> : (
                <div className="overflow-x-auto">
                  {ventasPendientes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No hay ventas pendientes de envío.</div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-orange-50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-orange-800 uppercase"># Venta</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-orange-800 uppercase">Cliente</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-orange-800 uppercase">Método Entrega</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-orange-800 uppercase">Monto Pagado / Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-orange-800 uppercase">Fecha Venta</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-orange-800 uppercase">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ventasPendientes.filter(v =>
                          v.cliente?.nombre?.toLowerCase().includes(searchTermLower) ||
                          v.numVenta.toString().includes(searchTermLower)
                        ).map((venta) => {
                          const totalVenta = venta.productos?.reduce((sum, p) => sum + (p.precioTotal || (p.cantidad * p.precioUnitario)), 0) || 0;
                          const totalPagado = venta.metodosPago?.reduce((sum, p) => sum + p.monto, 0) || 0;
                          return (
                            <tr key={venta._id} className="hover:bg-orange-50 transition-colors">
                              <td className="px-4 py-3 text-sm font-bold text-gray-700">#{venta.numVenta}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{venta.cliente?.nombre || 'Consumidor Final'}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                  {venta.metodoEntrega}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex flex-col">
                                  <span className="text-green-600 font-semibold">Pagado: Bs. {totalPagado.toFixed(2)}</span>
                                  <span className="text-gray-500 text-xs">Total: Bs. {totalVenta.toFixed(2)}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {new Date(venta.fecha).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => procesarVentaPendiente(venta)}
                                  className={`px-3 py-1 rounded text-sm text-white shadow-sm flex items-center ${venta.metodoEntrega?.toLowerCase().includes('recojo')
                                    ? 'bg-purple-600 hover:bg-purple-700'
                                    : 'bg-indigo-600 hover:bg-indigo-700'
                                    }`}
                                >
                                  {venta.metodoEntrega?.toLowerCase().includes('recojo') ? '🏢 Procesar Recojo' : '📦 Procesar Envío'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'envios' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Nuevo Envío</h2>
                  <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                    {showForm ? 'Cancelar' : '+ Programar Envío'}
                  </button>
                </div>

                {showForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="relative">
                      <input
                        type="text" placeholder="ID del Pedido" value={nuevoEnvio.pedidoId}
                        onChange={(e) => {
                          setNuevoEnvio({ ...nuevoEnvio, pedidoId: e.target.value });
                          buscarPedidos(e.target.value);
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      {mostrarDropdownPedidos && pedidosEncontrados.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                          {pedidosEncontrados.map((p) => (
                            <div key={p._id} onClick={() => seleccionarPedido(p)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                              Pedido #{p.pedidoNumero} - {p.cliente?.nombre}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Lista de productos del pedido seleccionado */}
                    {nuevoEnvio.productos && nuevoEnvio.productos.length > 0 && (
                      <div className="md:col-span-2 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                        <h4 className="text-sm font-semibold text-indigo-800 mb-2">Productos en este pedido:</h4>
                        <ul className="space-y-1">
                          {nuevoEnvio.productos.map((p, idx) => (
                            <li key={idx} className="text-sm text-indigo-700 flex justify-between">
                              <span>• {p.producto?.nombre || 'Producto'}</span>
                              <span className="font-medium">Cant: {p.cantidad}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <input type="text" placeholder="Cliente" value={nuevoEnvio.cliente} onChange={(e) => setNuevoEnvio({ ...nuevoEnvio, cliente: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" />
                    <input type="text" placeholder="Calle / Dirección" value={nuevoEnvio.calle} onChange={(e) => setNuevoEnvio({ ...nuevoEnvio, calle: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" />
                    <input type="text" placeholder="Ciudad" value={nuevoEnvio.ciudad} onChange={(e) => setNuevoEnvio({ ...nuevoEnvio, ciudad: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" />
                    <input type="text" placeholder="Departamento" value={nuevoEnvio.departamento} onChange={(e) => setNuevoEnvio({ ...nuevoEnvio, departamento: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" />
                    <select value={nuevoEnvio.tipoTransporte} onChange={(e) => setNuevoEnvio({ ...nuevoEnvio, tipoTransporte: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg">
                      <option value="Terrestre">Terrestre</option>
                      <option value="Aéreo">Aéreo</option>
                    </select>
                    {/* Selección de Tipo de Transportista - Ocultar si es Recojo */}
                    {!nuevoEnvio.metodoEntrega?.toLowerCase().includes('recojo') && (
                      <>
                        <div className="md:col-span-2 flex gap-4 p-2 bg-white rounded-lg border border-gray-200">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="tipoTransportistaSelect"
                              checked={!nuevoEnvio.empresaEnvio && nuevoEnvio.transportista !== undefined}
                              onChange={() => setNuevoEnvio({ ...nuevoEnvio, empresaEnvio: '', transportista: '' })}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Transportista Registrado</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="tipoTransportistaSelect"
                              checked={nuevoEnvio.empresaEnvio !== ''}
                              onChange={() => setNuevoEnvio({ ...nuevoEnvio, transportista: '', empresaEnvio: ' ' })}
                              className="text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Otro / Externo (Ocasional)</span>
                          </label>
                        </div>

                        {!nuevoEnvio.empresaEnvio ? (
                          <select
                            value={nuevoEnvio.transportista}
                            onChange={(e) => setNuevoEnvio({ ...nuevoEnvio, transportista: e.target.value })}
                            className="px-4 py-2 border border-gray-300 rounded-lg w-full"
                          >
                            <option value="">Seleccionar Transportista...</option>
                            {transportistas.map(t => <option key={t._id} value={t.nombre}>{t.nombre}</option>)}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Nombre de la Empresa o Transportista"
                            value={nuevoEnvio.empresaEnvio.trim()}
                            onChange={(e) => setNuevoEnvio({ ...nuevoEnvio, empresaEnvio: e.target.value })}
                            className="px-4 py-2 border border-blue-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 bg-blue-50"
                            autoFocus
                          />
                        )}
                      </>
                    )}
                    <select value={nuevoEnvio.metodoEntrega} onChange={(e) => setNuevoEnvio({ ...nuevoEnvio, metodoEntrega: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg">
                      <option value="Envio Domicilio">Envio Domicilio</option>
                      <option value="Envio Nacional">Envio Nacional</option>
                      <option value="Recojo en Almacen">Recojo en Almacen</option>
                    </select>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">Bs</span>
                        <input
                          type="number"
                          placeholder="Costo Envío"
                          value={nuevoEnvio.costoEnvio}
                          onChange={(e) => setNuevoEnvio({ ...nuevoEnvio, costoEnvio: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      <select
                        value={nuevoEnvio.cuentaId}
                        onChange={(e) => setNuevoEnvio({ ...nuevoEnvio, cuentaId: e.target.value })}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="">Seleccionar Caja/Cuenta (Requerido para Egresos)</option>
                        {bankAccounts.map(acc => (
                          <option key={acc._id} value={acc._id}>
                            {acc.nombreBanco} - Bs. {acc.saldo.toFixed(2)} ({acc.tipo})
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Account Selector populated */}
                    <div className="md:col-span-2 hidden"> {/* Hidden because moved above, just checking context */} </div>

                    {/* Replacing the Account Select Options */}
                    {/* We target the specific select via context. We know it has className "px-4 py-2 border border-gray-300 rounded-lg text-sm" */}

                    <button onClick={agregarEnvio} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Programar Envío</button>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa / Transportista</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {enviosFiltrados.map((envio) => (
                        <tr key={envio.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-blue-600 font-mono">{envio.tracking}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{envio.cliente}</td>
                          <td className="px-4 py-3"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100">{envio.estado}</span></td>
                          <td className="px-4 py-3 text-sm text-gray-500">{envio.metodoEntrega}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {envio.empresaEnvio ? <span className="font-semibold text-indigo-600">{envio.empresaEnvio}</span> : envio.transportista}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold">Bs {envio.costoEnvio}</td>
                          <td className="px-4 py-3 text-sm">
                            {envio.estado !== 'Entregado' && (
                              <button onClick={() => cambiarEstadoEnvioAPI(envio.id, 'Entregado')} className="text-indigo-600 hover:text-indigo-900 text-xs">
                                Actualizar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transportistas' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Transportistas</h2>
              <button onClick={() => {
                setShowTransportistaForm(!showTransportistaForm);
                setEditingTransportistaId(null);
                setNuevoTransportista({ nombre: '', nit: '', contacto: '', telefono: '', tipo: 'Terrestre', costoBase: 0, cobertura: [], tiempoEntrega: '', observaciones: '' });
              }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg mb-4">
                {showTransportistaForm ? 'Cancelar' : '+ Agregar'}
              </button>
              {showTransportistaForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <input type="text" placeholder="Nombre Empresa" value={nuevoTransportista.nombre} onChange={(e) => setNuevoTransportista({ ...nuevoTransportista, nombre: e.target.value })} className="px-4 py-2 border rounded-lg" />
                  <input type="text" placeholder="NIT / Carnet" value={nuevoTransportista.nit} onChange={(e) => setNuevoTransportista({ ...nuevoTransportista, nit: e.target.value })} className="px-4 py-2 border rounded-lg" />
                  <input type="text" placeholder="Nombre Contacto" value={nuevoTransportista.contacto} onChange={(e) => setNuevoTransportista({ ...nuevoTransportista, contacto: e.target.value })} className="px-4 py-2 border rounded-lg" />
                  <input type="text" placeholder="Teléfono" value={nuevoTransportista.telefono} onChange={(e) => setNuevoTransportista({ ...nuevoTransportista, telefono: e.target.value })} className="px-4 py-2 border rounded-lg" />
                  <select value={nuevoTransportista.tipo} onChange={(e) => setNuevoTransportista({ ...nuevoTransportista, tipo: e.target.value })} className="px-4 py-2 border rounded-lg">
                    <option value="Terrestre">Terrestre</option>
                    <option value="Aéreo">Aéreo</option>
                    <option value="Marítimo">Marítimo</option>
                    <option value="Mixto">Mixto</option>
                  </select>
                  <input type="number" placeholder="Costo Estimado" value={nuevoTransportista.costoBase} onChange={(e) => setNuevoTransportista({ ...nuevoTransportista, costoBase: e.target.value })} className="px-4 py-2 border rounded-lg" />
                  <input type="text" placeholder="Tiempo Entrega (ej: 2-3 días)" value={nuevoTransportista.tiempoEntrega} onChange={(e) => setNuevoTransportista({ ...nuevoTransportista, tiempoEntrega: e.target.value })} className="px-4 py-2 border rounded-lg" />

                  <div className="md:col-span-2">
                    <button onClick={agregarTransportista} className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      {editingTransportistaId ? 'Actualizar Transportista' : 'Guardar Transportista'}
                    </button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {transportistasFiltrados.map(t => (
                  <div key={t._id} className="border p-4 rounded-lg relative">
                    <h3 className="font-semibold text-lg">{t.nombre}</h3>
                    <p className="text-sm text-gray-600 mb-1">NIT: {t.nit}</p>
                    <p className="text-sm text-gray-600 mb-1">Contacto: {t.contacto}</p>
                    <p className="text-sm text-gray-600 mb-1">Tel: {t.telefono}</p>
                    <p className="text-sm text-gray-500 italic mb-2">{t.tipo}</p>
                    <p className="text-sm text-gray-600 mb-2">Costo Est.: ${t.costoBase}</p>

                    <div className="flex space-x-2 mt-2">
                      <button onClick={() => editarTransportista(t)} className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-200">Editar</button>
                      <button onClick={() => eliminarTransportista(t._id)} className="bg-red-100 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-200">Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rutas' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Rutas</h2>
              <button onClick={() => setShowForm(!showForm)} className="bg-green-600 text-white px-4 py-2 rounded-lg mb-4">
                {showForm ? 'Cancelar' : '+ Nueva Ruta'}
              </button>
              {showForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <input type="text" placeholder="Nombre" value={nuevaRuta.nombre} onChange={(e) => setNuevaRuta({ ...nuevaRuta, nombre: e.target.value })} className="px-4 py-2 border rounded-lg" />
                  <select value={nuevaRuta.transportista} onChange={(e) => setNuevaRuta({ ...nuevaRuta, transportista: e.target.value })} className="px-4 py-2 border rounded-lg">
                    <option value="">Seleccionar Transportista</option>
                    {transportistas.map(t => <option key={t._id} value={t._id}>{t.nombre}</option>)}
                  </select>
                  <input type="text" placeholder="Origen (Punto de Partida)" value={nuevaRuta.origen} onChange={(e) => setNuevaRuta({ ...nuevaRuta, origen: e.target.value })} className="px-4 py-2 border rounded-lg" />
                  <input type="text" placeholder="Destino (Punto de Entrega)" value={nuevaRuta.destino} onChange={(e) => setNuevaRuta({ ...nuevaRuta, destino: e.target.value })} className="px-4 py-2 border rounded-lg" />
                  <div className="md:col-span-2">
                    <button onClick={agregarRuta} className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Guardar Ruta</button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {rutasFiltradas.map(r => (
                  <div key={r._id} className="border p-4 rounded-lg relative">
                    <h3 className="font-semibold">{r.nombre}</h3>
                    <p className="text-sm">Origen: {r.origen}</p>
                    <p className="text-sm">Destino: {r.destino}</p>
                    <p className="text-sm text-gray-500 mt-1">Transportista: {r.transportista?.nombre || 'Desconocido'}</p>
                    <button onClick={() => eliminarRuta(r._id)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div >
    </div >
  );
};

export default LogisticaPage;