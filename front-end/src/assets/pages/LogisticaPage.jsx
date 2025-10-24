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

const LogisticaPage = ({ userRole }) => {
  const navigate = useNavigate();

  // ✅ CORREGIDO: Volver al HOME (menú principal)
  const volverAlHome = () => {
    navigate('/home');
  };

  // Estados para el módulo de logística
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('envios');
  const [showForm, setShowForm] = useState(false);
  const [showRetrasoForm, setShowRetrasoForm] = useState(false);
  const [selectedEnvio, setSelectedEnvio] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);

  // Datos de ejemplo
  const [envios, setEnvios] = useState([
    {
      id: 1,
      pedidoId: 'PED-001',
      cliente: 'Juan Pérez',
      direccion: 'Av. Principal 123, Ciudad',
      productos: ['Silla Ejecutiva', 'Mesa de Centro'],
      estado: 'En tránsito',
      transportista: 'Transportes XYZ',
      fechaEnvio: '2024-01-15',
      fechaEstimada: '2024-01-18',
      tiempoEstimado: '3-5 días',
      costoEnvio: 45.00,
      tracking: 'TRK123456789',
      ubicacionActual: 'Centro de Distribución Norte'
    },
    {
      id: 2,
      pedidoId: 'PED-002',
      cliente: 'María García',
      direccion: 'Calle Secundaria 456, Ciudad',
      productos: ['Sofá 3 Plazas'],
      estado: 'En almacén',
      transportista: 'Logística Rápida',
      fechaEnvio: '2024-01-16',
      fechaEstimada: '2024-01-20',
      tiempoEstimado: '4-7 días',
      costoEnvio: 75.00,
      tracking: 'TRK987654321',
      ubicacionActual: 'Almacén Principal'
    },
    {
      id: 3,
      pedidoId: 'PED-003',
      cliente: 'Carlos López',
      direccion: 'Plaza Central 789, Ciudad',
      productos: ['Estantería Moderna', 'Escritorio Oficina'],
      estado: 'Entregado',
      transportista: 'Envios Express',
      fechaEnvio: '2024-01-10',
      fechaEstimada: '2024-01-14',
      tiempoEstimado: 'Entregado',
      costoEnvio: 60.00,
      tracking: 'TRK456123789',
      ubicacionActual: 'Entregado al cliente'
    },
    {
      id: 4,
      pedidoId: 'PED-004',
      cliente: 'Ana Martínez',
      direccion: 'Boulevard Industrial 321, Ciudad',
      productos: ['Cama King Size'],
      estado: 'En reparto',
      transportista: 'Transportes Veloz',
      fechaEnvio: '2024-01-17',
      fechaEstimada: '2024-01-19',
      tiempoEstimado: '1-2 días',
      costoEnvio: 85.00,
      tracking: 'TRK789456123',
      ubicacionActual: 'En ruta de reparto'
    }
  ]);

  const [inventario, setInventario] = useState([
    {
      id: 1,
      producto: 'Silla Ejecutiva',
      sku: 'SCH-EXEC-001',
      cantidad: 150,
      ubicacion: 'Almacén A - Pasillo 1 - Estante 3',
      nivelMinimo: 20,
      estado: 'Disponible',
      categoria: 'Sillas'
    },
    {
      id: 2,
      producto: 'Mesa de Centro',
      sku: 'MES-CENT-002',
      cantidad: 75,
      ubicacion: 'Almacén A - Pasillo 2 - Estante 1',
      nivelMinimo: 15,
      estado: 'Disponible',
      categoria: 'Mesas'
    },
    {
      id: 3,
      producto: 'Sofá 3 Plazas',
      sku: 'SOF-3PL-003',
      cantidad: 8,
      ubicacion: 'Almacén B - Pasillo 1 - Estante 2',
      nivelMinimo: 5,
      estado: 'Stock Bajo',
      categoria: 'Sofás'
    },
    {
      id: 4,
      producto: 'Estantería Moderna',
      sku: 'EST-MOD-004',
      cantidad: 0,
      ubicacion: 'Almacén B - Pasillo 2 - Estante 4',
      nivelMinimo: 10,
      estado: 'Agotado',
      categoria: 'Estanterías'
    },
    {
      id: 5,
      producto: 'Escritorio Oficina',
      sku: 'ESC-OFI-005',
      cantidad: 25,
      ubicacion: 'Almacén C - Pasillo 1 - Estante 1',
      nivelMinimo: 8,
      estado: 'Disponible',
      categoria: 'Escritorios'
    }
  ]);

  const [transportistas, setTransportistas] = useState([]);
  const [nuevoTransportista, setNuevoTransportista] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    tipo: 'Terrestre',
    costoBase: 0,
    cobertura: [],
    tiempoEntrega: '',
    observaciones: ''
  });
  const [showTransportistaForm, setShowTransportistaForm] = useState(false);
  const [loadingTransportistas, setLoadingTransportistas] = useState(false);
  const [estadisticasTransportistas, setEstadisticasTransportistas] = useState(null);

  const [rutas, setRutas] = useState([
    {
      id: 1,
      nombre: 'Ruta Norte',
      origen: 'CD Norte',
      destino: 'Zona Norte',
      distancia: 350,
      duracion: '5 horas',
      estado: 'Activa',
      transportista: 'Transportes XYZ',
      frecuencia: 'Diaria'
    },
    {
      id: 2,
      nombre: 'Ruta Sur',
      origen: 'CD Central',
      destino: 'Zona Sur',
      distancia: 280,
      duracion: '4 horas',
      estado: 'Activa',
      transportista: 'Envios Express',
      frecuencia: 'Diaria'
    },
    {
      id: 3,
      nombre: 'Ruta Internacional',
      origen: 'Aeropuerto',
      destino: 'Internacional',
      distancia: 0,
      duracion: '2-3 días',
      estado: 'Activa',
      transportista: 'Logística Rápida',
      frecuencia: 'Semanal'
    }
  ]);

  const [nuevoEnvio, setNuevoEnvio] = useState({
    pedidoId: '',
    cliente: '',
    direccion: '',
    productos: [],
    transportista: '',
    costoEnvio: 0
  });

  const [nuevaRuta, setNuevaRuta] = useState({
    nombre: '',
    origen: '',
    destino: '',
    distancia: 0,
    transportista: '',
    frecuencia: 'Diaria'
  });

  // Filtrar datos según búsqueda
  const enviosFiltrados = envios.filter(envio =>
    envio.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    envio.pedidoId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    envio.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
    envio.tracking.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inventarioFiltrado = inventario.filter(item =>
    item.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const transportistasFiltrados = transportistas.filter(trans =>
    trans.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trans.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trans.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const rutasFiltradas = rutas.filter(ruta =>
    ruta.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ruta.origen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ruta.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ruta.transportista.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funciones para envíos
  const cambiarEstadoEnvio = (id, nuevoEstado) => {
    setEnvios(envios.map(envio =>
      envio.id === id ? {
        ...envio,
        estado: nuevoEstado,
        ubicacionActual: nuevoEstado === 'Entregado' ? 'Entregado al cliente' :
                         nuevoEstado === 'En reparto' ? 'En ruta de reparto' :
                         nuevoEstado === 'En tránsito' ? 'Centro de Distribución Norte' : envio.ubicacionActual
      } : envio
    ));
  };

  // Función para notificar retraso
  const notificarRetraso = (envio) => {
    setSelectedEnvio(envio);
    setShowRetrasoForm(true);
  };

  // Función para actualizar tiempo estimado
  const actualizarTiempoEstimado = (envio) => {
    const nuevoTiempo = prompt('Nuevo tiempo estimado (ej: "5-7 días", "1 semana"):');
    if (nuevoTiempo) {
      setEnvios(envios.map(e =>
        e.id === envio.id ? { ...e, tiempoEstimado: nuevoTiempo } : e
      ));
    }
  };

  // Función para cargar estadísticas
  const cargarEstadisticas = async () => {
    setLoading(true);
    try {
      // Simular carga de estadísticas
      setTimeout(() => {
        setEstadisticas({
          periodo: 'mes',
          totalPedidos: envios.length,
          pedidosPorEstado: {
            pendiente: envios.filter(e => e.estado === 'En almacén').length,
            en_proceso: envios.filter(e => e.estado === 'En tránsito').length,
            despachado: envios.filter(e => e.estado === 'En reparto').length,
            entregado: envios.filter(e => e.estado === 'Entregado').length,
            retrasado: envios.filter(e => e.estado === 'Retrasado').length
          },
          costoTotalEnvios: envios.reduce((sum, e) => sum + e.costoEnvio, 0),
          tiempoPromedioEntrega: 4.2,
          tasaEntregaExitosa: 87.5
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setLoading(false);
    }
  };

  // Funciones para transportistas
  const cargarTransportistas = async () => {
    setLoadingTransportistas(true);
    try {
      const data = await apiFetch('/transportistas/activos');
      setTransportistas(data);
    } catch (error) {
      console.error('Error cargando transportistas:', error);
      alert('Error al cargar transportistas: ' + error.message);
    } finally {
      setLoadingTransportistas(false);
    }
  };

  const cargarEstadisticasTransportistas = async () => {
    try {
      const data = await apiFetch('/transportistas/estadisticas');
      setEstadisticasTransportistas(data);
    } catch (error) {
      console.error('Error cargando estadísticas de transportistas:', error);
    }
  };

  const agregarTransportista = async () => {
    // Validaciones
    if (!nuevoTransportista.nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }
    if (!nuevoTransportista.contacto.trim()) {
      alert('El contacto es requerido');
      return;
    }
    if (!nuevoTransportista.telefono.trim()) {
      alert('El teléfono es requerido');
      return;
    }
    if (!nuevoTransportista.email.trim()) {
      alert('El email es requerido');
      return;
    }
    if (nuevoTransportista.costoBase <= 0) {
      alert('El costo base debe ser mayor a 0');
      return;
    }
    if (!nuevoTransportista.tiempoEntrega.trim()) {
      alert('El tiempo de entrega es requerido');
      return;
    }

    try {
      const transportistaData = {
        ...nuevoTransportista,
        costoBase: parseFloat(nuevoTransportista.costoBase)
      };

      await apiFetch('/transportistas', {
        method: 'POST',
        body: JSON.stringify(transportistaData)
      });

      alert('✅ Transportista creado exitosamente');
      setNuevoTransportista({
        nombre: '',
        contacto: '',
        telefono: '',
        email: '',
        tipo: 'Terrestre',
        costoBase: 0,
        cobertura: [],
        tiempoEntrega: '',
        observaciones: ''
      });
      setShowTransportistaForm(false);
      cargarTransportistas();
      cargarEstadisticasTransportistas();
    } catch (error) {
      console.error('Error creando transportista:', error);
      alert('Error al crear transportista: ' + error.message);
    }
  };

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    cargarEstadisticas();
    cargarTransportistas();
    cargarEstadisticasTransportistas();
  }, []);

  const agregarEnvio = () => {
    if (!nuevoEnvio.pedidoId || !nuevoEnvio.cliente) return;

    const envio = {
      id: envios.length + 1,
      ...nuevoEnvio,
      fechaEnvio: new Date().toISOString().split('T')[0],
      fechaEstimada: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estado: 'En almacén',
      tracking: `TRK${Date.now()}`,
      ubicacionActual: 'Almacén Principal'
    };

    setEnvios([...envios, envio]);
    setNuevoEnvio({
      pedidoId: '',
      cliente: '',
      direccion: '',
      productos: [],
      transportista: '',
      costoEnvio: 0
    });
    setShowForm(false);
  };

  // Funciones para rutas
  const agregarRuta = () => {
    if (!nuevaRuta.nombre || !nuevaRuta.origen || !nuevaRuta.destino) return;

    const ruta = {
      id: rutas.length + 1,
      ...nuevaRuta,
      estado: 'Activa',
      duracion: nuevaRuta.distancia > 500 ? '8+ horas' : 
                nuevaRuta.distancia > 300 ? '5-7 horas' :
                nuevaRuta.distancia > 150 ? '3-4 horas' : '1-2 horas'
    };

    setRutas([...rutas, ruta]);
    setNuevaRuta({
      nombre: '',
      origen: '',
      destino: '',
      distancia: 0,
      transportista: '',
      frecuencia: 'Diaria'
    });
  };

  // Cálculos de métricas
  const totalEnvios = envios.length;
  const enviosEntregados = envios.filter(e => e.estado === 'Entregado').length;
  const enviosTransito = envios.filter(e => e.estado === 'En tránsito').length;
  const costoTotalEnvios = envios.reduce((sum, envio) => sum + envio.costoEnvio, 0);

  const productosDisponibles = inventario.filter(p => p.estado === 'Disponible').length;
  const productosStockBajo = inventario.filter(p => p.estado === 'Stock Bajo').length;
  const productosAgotados = inventario.filter(p => p.estado === 'Agotado').length;

  const transportistasActivos = transportistas.filter(t => t.estado === 'Activo').length;
  const rutasActivas = rutas.filter(r => r.estado === 'Activa').length;

return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar de Navegación */}
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
              <span className="text-sm text-gray-600">Módulo de Logística</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {userRole || 'Usuario'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-indigo-600 mb-2">Módulo de Logística</h1>
            <p className="text-gray-600 text-lg">Gestión de envíos, inventario y distribución</p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Total Envíos</h3>
                  <p className="text-2xl font-bold text-gray-800">{totalEnvios}</p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <span className="text-indigo-600 text-xl">🚚</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Entregados</h3>
                  <p className="text-2xl font-bold text-gray-800">{enviosEntregados}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <span className="text-green-600 text-xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">En Tránsito</h3>
                  <p className="text-2xl font-bold text-gray-800">{enviosTransito}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <span className="text-blue-600 text-xl">📦</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Costo Total</h3>
                  <p className="text-2xl font-bold text-gray-800">${costoTotalEnvios}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <span className="text-purple-600 text-xl">💰</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pestañas */}
          <div className="bg-white rounded-xl shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {['envios', 'inventario', 'transportistas', 'rutas'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab === 'envios' && '🚚 Gestión de Envíos'}
                    {tab === 'inventario' && '📊 Control de Inventario'}
                    {tab === 'transportistas' && '🏢 Transportistas'}
                    {tab === 'rutas' && '🛣️ Rutas de Distribución'}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Barra de Búsqueda */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder={`Buscar en ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                🔍
              </div>
            </div>
          </div>

          {/* Contenido de Pestañas */}
          {activeTab === 'envios' && (
            <div className="space-y-6">
              {/* Formulario de Nuevo Envío */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Nuevo Envío</h2>
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
                  >
                    {showForm ? 'Cancelar' : '+ Programar Envío'}
                  </button>
                </div>
                
                {showForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="ID del Pedido"
                      value={nuevoEnvio.pedidoId}
                      onChange={(e) => setNuevoEnvio({...nuevoEnvio, pedidoId: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Cliente"
                      value={nuevoEnvio.cliente}
                      onChange={(e) => setNuevoEnvio({...nuevoEnvio, cliente: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Dirección"
                      value={nuevoEnvio.direccion}
                      onChange={(e) => setNuevoEnvio({...nuevoEnvio, direccion: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      value={nuevoEnvio.transportista}
                      onChange={(e) => setNuevoEnvio({...nuevoEnvio, transportista: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Seleccionar transportista</option>
                      {transportistas.filter(t => t.estado === 'Activo').map(trans => (
                        <option key={trans._id || trans.id} value={trans.nombre}>
                          {trans.nombre} - {trans.tipo}
                        </option>
                      ))}
                    </select>
                    <div className="md:col-span-2 flex space-x-4">
                      <button
                        onClick={agregarEnvio}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                      >
                        Programar Envío
                      </button>
                      <button
                        onClick={() => setShowForm(false)}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de Envíos */}
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Envíos Programados</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo Estimado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transportista</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {enviosFiltrados.map((envio) => (
                        <tr key={envio.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {envio.pedidoId}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {envio.cliente}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-blue-600 font-mono">
                            {envio.tracking}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              envio.estado === 'Entregado' ? 'bg-green-100 text-green-800' :
                              envio.estado === 'En tránsito' ? 'bg-blue-100 text-blue-800' :
                              envio.estado === 'En reparto' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {envio.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {envio.tiempoEstimado}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {envio.ubicacionActual}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {envio.transportista}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ${envio.costoEnvio}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {envio.estado !== 'Entregado' && (
                                <button
                                  onClick={() => cambiarEstadoEnvio(envio.id, 
                                    envio.estado === 'En almacén' ? 'En tránsito' : 
                                    envio.estado === 'En tránsito' ? 'En reparto' : 'Entregado'
                                  )}
                                  className="text-indigo-600 hover:text-indigo-900 text-xs"
                                >
                                  {envio.estado === 'En almacén' ? 'Despachar' : 
                                   envio.estado === 'En tránsito' ? 'En Reparto' : 'Entregar'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventario' && (
            <div className="space-y-6">
              {/* Métricas de Inventario */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Disponibles</h3>
                      <p className="text-2xl font-bold text-gray-800">{productosDisponibles}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-lg">
                      <span className="text-green-600 text-xl">✅</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Stock Bajo</h3>
                      <p className="text-2xl font-bold text-gray-800">{productosStockBajo}</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <span className="text-yellow-600 text-xl">⚠️</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-600">Agotados</h3>
                      <p className="text-2xl font-bold text-gray-800">{productosAgotados}</p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-lg">
                      <span className="text-red-600 text-xl">❌</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de Inventario */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Control de Inventario</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventarioFiltrado.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.producto}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {item.sku}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {item.categoria}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <span className={`font-semibold ${
                              item.cantidad <= item.nivelMinimo ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {item.cantidad}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">/ min: {item.nivelMinimo}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {item.ubicacion}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.estado === 'Disponible' ? 'bg-green-100 text-green-800' :
                              item.estado === 'Stock Bajo' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {item.estado}
                            </span>
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
            <div className="space-y-6">
              {/* Formulario de Nuevo Transportista */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Transportistas</h2>
                  <button
                    onClick={() => setShowTransportistaForm(!showTransportistaForm)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
                  >
                    {showTransportistaForm ? 'Cancelar' : '+ Agregar Transportista'}
                  </button>
                </div>

                {showTransportistaForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="Nombre del transportista"
                      value={nuevoTransportista.nombre}
                      onChange={(e) => setNuevoTransportista({...nuevoTransportista, nombre: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Contacto"
                      value={nuevoTransportista.contacto}
                      onChange={(e) => setNuevoTransportista({...nuevoTransportista, contacto: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Teléfono"
                      value={nuevoTransportista.telefono}
                      onChange={(e) => setNuevoTransportista({...nuevoTransportista, telefono: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={nuevoTransportista.email}
                      onChange={(e) => setNuevoTransportista({...nuevoTransportista, email: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      value={nuevoTransportista.tipo}
                      onChange={(e) => setNuevoTransportista({...nuevoTransportista, tipo: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Terrestre">Terrestre</option>
                      <option value="Aéreo">Aéreo</option>
                      <option value="Marítimo">Marítimo</option>
                      <option value="Mixto">Mixto</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Costo base"
                      value={nuevoTransportista.costoBase}
                      onChange={(e) => setNuevoTransportista({...nuevoTransportista, costoBase: parseFloat(e.target.value) || 0})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Tiempo de entrega (ej: 2-3 días)"
                      value={nuevoTransportista.tiempoEntrega}
                      onChange={(e) => setNuevoTransportista({...nuevoTransportista, tiempoEntrega: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <textarea
                      placeholder="Observaciones"
                      value={nuevoTransportista.observaciones}
                      onChange={(e) => setNuevoTransportista({...nuevoTransportista, observaciones: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 md:col-span-2"
                      rows="3"
                    />
                    <div className="md:col-span-2 flex space-x-4">
                      <button
                        onClick={agregarTransportista}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                      >
                        Crear Transportista
                      </button>
                      <button
                        onClick={() => setShowTransportistaForm(false)}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de Transportistas */}
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Transportistas Registrados</h3>
                {loadingTransportistas ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-gray-600">Cargando transportistas...</p>
                  </div>
                ) : transportistasFiltrados.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hay transportistas registrados aún.</p>
                    <p className="text-sm text-gray-400 mt-1">Haz clic en "Agregar Transportista" para comenzar.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {transportistasFiltrados.map((trans) => (
                      <div key={trans._id || trans.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-800">{trans.nombre}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            trans.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {trans.estado}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>📧 {trans.contacto}</p>
                          <p>📞 {trans.telefono}</p>
                          <p>🚛 {trans.tipo}</p>
                          <p>💰 Costo base: ${trans.costoBase}</p>
                          <p>🌍 Cobertura: {trans.cobertura?.join(', ') || 'No especificada'}</p>
                          <p>⏱️ Tiempo: {trans.tiempoEntrega}</p>
                          {trans.rating > 0 && (
                            <div className="flex items-center">
                              <span className="text-yellow-500">⭐</span>
                              <span className="ml-1">{trans.rating}/5.0</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'rutas' && (
            <div className="space-y-6">
              {/* Formulario de Nueva Ruta */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Rutas de Distribución</h2>
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                  >
                    {showForm ? 'Cancelar' : '+ Nueva Ruta'}
                  </button>
                </div>
                
                {showForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="Nombre de la ruta"
                      value={nuevaRuta.nombre}
                      onChange={(e) => setNuevaRuta({...nuevaRuta, nombre: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Origen"
                      value={nuevaRuta.origen}
                      onChange={(e) => setNuevaRuta({...nuevaRuta, origen: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Destino"
                      value={nuevaRuta.destino}
                      onChange={(e) => setNuevaRuta({...nuevaRuta, destino: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      placeholder="Distancia (km)"
                      value={nuevaRuta.distancia}
                      onChange={(e) => setNuevaRuta({...nuevaRuta, distancia: parseInt(e.target.value) || 0})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <select
                      value={nuevaRuta.transportista}
                      onChange={(e) => setNuevaRuta({...nuevaRuta, transportista: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Seleccionar transportista</option>
                      {transportistas.filter(t => t.estado === 'Activo').map(trans => (
                        <option key={trans.id} value={trans.nombre}>
                          {trans.nombre}
                        </option>
                      ))}
                    </select>
                    <select
                      value={nuevaRuta.frecuencia}
                      onChange={(e) => setNuevaRuta({...nuevaRuta, frecuencia: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Diaria">Diaria</option>
                      <option value="Semanal">Semanal</option>
                      <option value="Quincenal">Quincenal</option>
                      <option value="Mensual">Mensual</option>
                    </select>
                    <div className="md:col-span-2 flex space-x-4">
                      <button
                        onClick={agregarRuta}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                      >
                        Crear Ruta
                      </button>
                      <button
                        onClick={() => setShowForm(false)}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de Rutas */}
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Rutas Activas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rutasFiltradas.map((ruta) => (
                    <div key={ruta.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">{ruta.nombre}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          ruta.estado === 'Activa' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {ruta.estado}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p className="flex items-center">
                          <span className="font-medium mr-2">📍 Origen:</span>
                          {ruta.origen}
                        </p>
                        <p className="flex items-center">
                          <span className="font-medium mr-2">🎯 Destino:</span>
                          {ruta.destino}
                        </p>
                        <p className="flex items-center">
                          <span className="font-medium mr-2">📏 Distancia:</span>
                          {ruta.distancia} km
                        </p>
                        <p className="flex items-center">
                          <span className="font-medium mr-2">⏱️ Duración:</span>
                          {ruta.duracion}
                        </p>
                        <p className="flex items-center">
                          <span className="font-medium mr-2">🚛 Transportista:</span>
                          {ruta.transportista}
                        </p>
                        <p className="flex items-center">
                          <span className="font-medium mr-2">🔄 Frecuencia:</span>
                          {ruta.frecuencia}
                        </p>
                      </div>
                      <div className="mt-4 flex space-x-2">
                        <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">
                          Editar
                        </button>
                        <button 
                          onClick={() => setRutas(rutas.filter(r => r.id !== ruta.id))}
                          className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogisticaPage;