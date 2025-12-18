import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import QRCode from 'react-qr-code';

const FabricacionPage = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // Handle initial tab from navigation state
  useEffect(() => {
     if (location.state?.initialTab) {
        setActiveTab(location.state.initialTab);
     }
  }, [location.state]);

  // ✅ Volver al HOME (menú principal)
  const volverAlHome = () => {
    navigate('/home');
  };

  // Estados para el módulo de fabricación
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ordenes');

  const [showForm, setShowForm] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedOrdenId, setSelectedOrdenId] = useState(null);
  const [editingOrden, setEditingOrden] = useState(null); // Estado para la orden que se está editando
  const [viewingOrden, setViewingOrden] = useState(null); // Estado para ver detalles

  // Estados de datos
  const [ordenesFabricacion, setOrdenesFabricacion] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para nueva orden
  const [nuevaOrden, setNuevaOrden] = useState({
    nombre: '',
    cantidad: 1,
    precioCompra: 0,
    precioVenta: 0,
    tiempoEstimado: 1,
    materiales: [],
    imagen: ''
  });

  // Estado para nuevo material (ahora usa ProductoTienda)
  const [nuevoMaterial, setNuevoMaterial] = useState({
    nombre: '',
    categoria: '',
    cantidad: 0,
    cantidadMinima: 10,
    precioCompra: 0,
    precioVenta: 0,
    unidad: '',
    unidad: '',
    ubicacion: '',
    imagen: null
  });

  // Estado para selección de material en el formulario de orden
  // Estado para selección de material en el formulario de orden
  const [materialSeleccionado, setMaterialSeleccionado] = useState('');
  const [cantidadMaterialSeleccionada, setCantidadMaterialSeleccionada] = useState(1);
  const [searchTermMaterial, setSearchTermMaterial] = useState(''); // Buscador
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Dropdown visibility

  // Efecto para limpiar el buscador cuando se cierra el modal
  useEffect(() => {
    if (!showForm) {
      setSearchTermMaterial('');
      setIsDropdownOpen(false);
    }
  }, [showForm]);

  // Estado para datos de finalización de producción
  const [datosCompletados, setDatosCompletados] = useState({
      descripcion: '',
      categoria: '',
      precioVenta: 0,
      imagen: ''
  });

  // Estado para nueva máquina
  const [nuevaMaquina, setNuevaMaquina] = useState({
    nombre: '',
    tipo: '',
    estado: 'Operativa',
    costo: 0
  });

  // Estado para WhatsApp
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState('DISCONNECTED');
  const [qrCode, setQrCode] = useState('');
  const [loadingQr, setLoadingQr] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    await Promise.all([cargarOrdenes(), cargarMateriales(), cargarMaquinas()]);
    setLoading(false);
  };

  const cargarOrdenes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/produccion', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrdenesFabricacion(data);
      }
    } catch (error) {
      console.error('Error cargando órdenes:', error);
    }
  };

  const cargarMateriales = async () => {
    try {
      // Fetch from dedicated Materia Prima endpoint
      const response = await fetch('http://localhost:5000/api/materiaPrima', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMateriales(data);
      }
    } catch (error) {
      console.error('Error cargando materiales:', error);
    }
  };

  const cargarMaquinas = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/maquinas', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMaquinas(data);
      }
    } catch (error) {
      console.error('Error cargando máquinas:', error);
    }
  };

  // Calcular costo estimado automáticamente
  // Calcular costo estimado automáticamente
  useEffect(() => {
    const costoTotal = nuevaOrden.materiales.reduce((acc, item) => {
      // Find material details to get price
      const mat = materiales.find(m => m._id === item.material);
      const precio = mat ? (mat.precioCompra || 0) : 0;
      return acc + (precio * item.cantidad);
    }, 0);
    
    setNuevaOrden(prev => ({ ...prev, precioCompra: costoTotal }));
  }, [nuevaOrden.materiales, materiales]);

  const agregarMaterialAOrden = () => {
    if (!materialSeleccionado || cantidadMaterialSeleccionada <= 0) return;
    
    // Verificar stock
    const material = materiales.find(m => m._id === materialSeleccionado);
    if (!material) return;
    if (material.cantidad < cantidadMaterialSeleccionada) {
        alert(`Stock insuficiente. Solo hay ${material.cantidad} disponibles.`);
        return;
    }

      // Check if already exists
      const exists = nuevaOrden.materiales.find(m => m.material === materialSeleccionado);
      
      let updatedMaterials;
      if (exists) {
          updatedMaterials = nuevaOrden.materiales.map(m => 
              m.material === materialSeleccionado 
                  ? { ...m, cantidad: m.cantidad + cantidadMaterialSeleccionada }
                  : m
          );
      } else {
          updatedMaterials = [...nuevaOrden.materiales, { material: materialSeleccionado, cantidad: cantidadMaterialSeleccionada }];
      }

      setNuevaOrden({ ...nuevaOrden, materiales: updatedMaterials });
      setMaterialSeleccionado('');
      setCantidadMaterialSeleccionada(1);
      setSearchTermMaterial(''); // Reset search
  };

  const eliminarMaterialDeOrden = (idMaterial) => {
      setNuevaOrden({
          ...nuevaOrden,
          materiales: nuevaOrden.materiales.filter(m => m.material !== idMaterial)
      });
  };

  // Filtrar datos según búsqueda
  const ordenesFiltradas = ordenesFabricacion.filter(orden =>
    orden.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const materialesFiltrados = materiales.filter(mat =>
    mat.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mat.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maquinasFiltradas = maquinas.filter(maq =>
    maq.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    maq.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    maq.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funciones para órdenes de fabricación
  const guardarOrden = async () => {
    try {
      const url = editingOrden 
          ? `http://localhost:5000/api/produccion/${editingOrden._id}`
          : 'http://localhost:5000/api/produccion';
      
      const method = editingOrden ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...nuevaOrden,
          idProduccion: editingOrden ? editingOrden.idProduccion : `PROD-${Date.now()}`
        })
      });

      if (response.ok) {
        alert(`✅ Orden ${editingOrden ? 'actualizada' : 'creada'} exitosamente`);
        setShowForm(false);
        setEditingOrden(null); // Limpiar modo edición
        cargarOrdenes();
        // Reset form
        setNuevaOrden({
          nombre: '',
          cantidad: 1,
          precioCompra: 0,
          precioVenta: 0,
          tiempoEstimado: 1,
          materiales: [],
          imagen: ''
        });
      } else {
        const errorData = await response.json();
        alert(`❌ Error al ${editingOrden ? 'actualizar' : 'crear'} orden: ${errorData.message || errorData.error || 'Error desconocido'}`);
        if (errorData.details) console.error(errorData.details);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };

  const abrirModalEditar = (orden) => {
      setEditingOrden(orden);
      
      // Mapear materiales para que coincidan con la estructura del formulario { material: id, cantidad: n }
      // Asegurarse de tomar el _id del objeto material populado
      const materialesFormato = orden.materiales.map(m => ({
          material: m.material._id || m.material, // Handle populated vs unpopulated
          cantidad: m.cantidad
      }));

      setNuevaOrden({
          nombre: orden.nombre,
          cantidad: orden.cantidad,
          precioCompra: orden.precioCompra,
          precioVenta: orden.precioVenta,
          tiempoEstimado: orden.tiempoEstimado || 1,
          materiales: materialesFormato,
          imagen: orden.imagen || ''
      });
      setShowForm(true);
  };

  const iniciarProduccionAutomatica = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/produccion/${id}/iniciar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert('✅ Producción iniciada. Materiales descontados.');
        cargarOrdenes();
        cargarMateriales(); // Recargar materiales para ver el descuento
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };

  const abrirModalConfirmacion = (orden) => {
      setSelectedOrdenId(orden._id);
      setDatosCompletados({
          descripcion: `Producto fabricado: ${orden.nombre}`,
          categoria: 'Muebles', // Default or fetch existing
          precioVenta: orden.precioVenta || 0,
          imagen: orden.imagen || ''
      });
      setShowCompletionModal(true);
  };

  const confirmarProduccion = async () => {
    try {
      if (!selectedOrdenId) return;

      const response = await fetch(`http://localhost:5000/api/produccion/${selectedOrdenId}/confirmar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(datosCompletados)
      });

      if (response.ok) {
        alert('✅ Producción confirmada y producto creado en inventario.');
        setShowCompletionModal(false);
        cargarOrdenes();
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };

  // Funciones para materiales (usa endpoint dedicado)
  const agregarMaterial = async () => {
    try {
      const formData = new FormData();
      formData.append('nombre', nuevoMaterial.nombre);
      formData.append('categoria', nuevoMaterial.categoria);
      formData.append('cantidad', nuevoMaterial.cantidad);
      formData.append('precioCompra', nuevoMaterial.precioCompra);
      if (nuevoMaterial.imagen) {
        formData.append('imagen', nuevoMaterial.imagen);
      }

      const response = await fetch('http://localhost:5000/api/materiaPrima', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          // No Content-Type for FormData, browser sets it with boundary
        },
        body: formData
      });

      if (response.ok) {
        alert('✅ Material agregado exitosamente');
        setShowForm(false);
        cargarMateriales();
        setNuevoMaterial({
          nombre: '',
          categoria: '',
          cantidad: 0,
          cantidadMinima: 10,
          precioCompra: 0,
          precioVenta: 0,
          unidad: '',
          ubicacion: '',
          imagen: null
        });
      } else {
        const errorData = await response.json();
        alert(`❌ Error al agregar material: ${errorData.error || errorData.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };

  // Funciones para máquinas
  const cambiarEstadoMaquina = async (id, nuevoEstado) => {
    try {
      const response = await fetch(`http://localhost:5000/api/maquinas/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (response.ok) {
        cargarMaquinas();
      } else {
        alert('❌ Error al actualizar estado de máquina');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const agregarMaquina = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/maquinas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(nuevaMaquina)
      });

      if (response.ok) {
        alert('✅ Máquina agregada exitosamente');
        setShowForm(false);
        cargarMaquinas();
        setNuevaMaquina({
          nombre: '',
          tipo: '',
          estado: 'Operativa',
          costo: 0
        });
      } else {
        alert('❌ Error al agregar máquina');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }

  };

  // Funciones de WhatsApp
  const checkWhatsAppStatus = async () => {
      setLoadingQr(true);
      try {
          const response = await fetch('http://localhost:5000/api/whatsapp/status');
          const data = await response.json();
          setWhatsappStatus(data.status);
          setQrCode(data.qr);
      } catch (error) {
          console.error("Error fetching WhatsApp status:", error);
      }
      setLoadingQr(false);
  };

  useEffect(() => {
      let interval;
      if (showWhatsAppModal) {
          checkWhatsAppStatus();
          interval = setInterval(checkWhatsAppStatus, 3000); // Poll every 3 seconds while modal is open
      }
      return () => clearInterval(interval);
  }, [showWhatsAppModal]);

  const restartWhatsApp = async () => {
      if (!window.confirm("¿Reiniciar la conexión de WhatsApp? Esto generará un nuevo QR.")) return;
      try {
          await fetch('http://localhost:5000/api/whatsapp/restart', { method: 'POST' });
          alert("Reiniciando servicio... Espere unos segundos.");
          setQrCode('');
          setWhatsappStatus('INITIALIZING');
      } catch (error) {
          console.error("Error restarting WhatsApp:", error);
      }
  };


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
              <span className="text-sm text-gray-600">Módulo de Fabricación</span>
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

          <div className="mb-8 flex justify-between items-center">
            <div>
                <h1 className="text-4xl font-bold text-orange-600 mb-2">Módulo de Fabricación</h1>
                <p className="text-gray-600 text-lg">Gestión de producción, materiales y equipos</p>
            </div>
            <button 
                onClick={() => setShowWhatsAppModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-lg"
            >
                <span className="text-xl">🔔</span>
                <span>Configurar Notificaciones</span>
            </button>
          </div>

          {/* WhatsApp Modal */}
          {showWhatsAppModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                  <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative">
                      <button 
                          onClick={() => setShowWhatsAppModal(false)}
                          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
                      >
                          ✕
                      </button>
                      
                      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
                          WhatsApp Notificaciones
                      </h2>

                      <div className="flex justify-center mb-6">
                          <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                              whatsappStatus === 'READY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                              Estado: {whatsappStatus === 'READY' ? 'CONECTADO 🟢' : 'DESCONECTADO 🔴'}
                          </div>
                      </div>

                      <div className="flex flex-col items-center justify-center min-h-[250px] bg-gray-50 rounded-lg p-4 mb-6 border-2 border-dashed border-gray-300">
                          {loadingQr ? (
                              <p className="text-gray-500 animate-pulse">Cargando código QR...</p>
                          ) : whatsappStatus === 'READY' ? (
                              <div className="text-center">
                                  <div className="text-6xl mb-4">✅</div>
                                  <p className="text-gray-700 font-medium">¡El sistema está vinculado!</p>
                                  <p className="text-sm text-gray-500 mt-2">Recibirás alertas de inicio y retraso.</p>
                              </div>
                          ) : qrCode ? (
                              <div className="bg-white p-2 rounded shadow-sm">
                                  <QRCode value={qrCode} size={200} />
                                  <p className="text-xs text-center text-gray-500 mt-2">Escanea con tu celular</p>
                              </div>
                          ) : (
                              <div className="text-center">
                                  <p className="text-gray-500 mb-2">Esperando código QR...</p>
                                  {whatsappStatus === 'INITIALIZING' && <p className="text-xs text-orange-500">Iniciando cliente...</p>}
                              </div>
                          )}
                      </div>

                      <div className="flex justify-center">
                          <button 
                              onClick={restartWhatsApp}
                              className="text-sm text-blue-600 hover:underline hover:text-blue-800"
                          >
                              ↻ Reiniciar conexión / Generar nuevo QR
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {/* Pestañas */}
          <div className="bg-white rounded-xl shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {['ordenes', 'materiales', 'maquinas'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm capitalize ${activeTab === tab
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    {tab === 'ordenes' && '🏭 Órdenes de Fabricación'}
                    {tab === 'materiales' && '📦 Materiales'}
                    {tab === 'maquinas' && '🔧 Máquinas y Equipos'}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Controles Superiores */}
          <div className="flex justify-between items-center mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder={`Buscar en ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-80"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                🔍
              </div>
            </div>

            {activeTab === 'ordenes' && (
              <button
                onClick={() => {
                    setShowForm(!showForm);
                    if (showForm) { // Si estaba abierto y se cierra, limpiar edición
                        setEditingOrden(null);
                        setNuevaOrden({
                            nombre: '',
                            cantidad: 1,
                            precioCompra: 0,
                            precioVenta: 0,
                            tiempoEstimado: 1,
                            materiales: [],
                            imagen: ''
                        });
                    }
                }}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition duration-200 font-semibold"
              >
                {showForm ? 'Cancelar' : '+ Nueva Orden'}
              </button>
            )}

            {activeTab === 'materiales' && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200 font-semibold"
              >
                {showForm ? 'Cancelar' : '+ Nuevo Material'}
              </button>
            )}

            {activeTab === 'maquinas' && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold"
              >
                {showForm ? 'Cancelar' : '+ Nueva Máquina'}
              </button>
            )}
          </div>

          {/* Contenido de Pestañas */}
          {activeTab === 'ordenes' && (
            <div className="space-y-6">
              {/* Formulario de Nueva Orden */}
              {showForm && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                      {editingOrden ? 'Editar Orden de Fabricación' : 'Nueva Orden de Fabricación'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Producto *</label>
                      <input
                        type="text"
                        value={nuevaOrden.nombre}
                        onChange={(e) => setNuevaOrden({ ...nuevaOrden, nombre: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Nombre del producto a fabricar"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad *</label>
                      <input
                        type="number"
                        min="1"
                        value={nuevaOrden.cantidad}
                        onChange={(e) => setNuevaOrden({ ...nuevaOrden, cantidad: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Costo Estimado (Auto)</label>
                      <input
                        type="number"
                        value={nuevaOrden.precioCompra}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 focus:outline-none"
                        title="Calculado automáticamente según materiales"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Precio Venta Estimado</label>
                      <input
                        type="number"
                        value={nuevaOrden.precioVenta}
                        onChange={(e) => setNuevaOrden({ ...nuevaOrden, precioVenta: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tiempo Estimado (días)</label>
                      <input
                        type="number"
                        value={nuevaOrden.tiempoEstimado}
                        onChange={(e) => setNuevaOrden({ ...nuevaOrden, tiempoEstimado: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Selección de Materiales (Simplificada por ahora) */}
                  {/* Selección de Materiales (Carrito) */}
                  <div className="mt-6 border-t pt-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Materiales Requeridos</h3>
                    
                    {/* Selector */}
                    {/* Selector Buscable */}
                    <div className="flex flex-wrap gap-4 items-end mb-4 bg-gray-50 p-4 rounded-lg relative">
                        <div className="flex-1 min-w-[300px] relative">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Material (Buscar por Nombre, Color o Código)</label>
                            
                            <input
                                type="text"
                                value={searchTermMaterial}
                                onChange={(e) => {
                                    setSearchTermMaterial(e.target.value);
                                    setIsDropdownOpen(true);
                                    setMaterialSeleccionado(''); 
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                placeholder="Escribe para buscar..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />

                            {/* Dropdown de Resultados */}
                            {isDropdownOpen && (
                                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {materiales.filter(mat => {
                                        const term = searchTermMaterial.toLowerCase();
                                        const nombre = mat.nombre?.toLowerCase() || '';
                                        const color = mat.color?.toLowerCase() || '';
                                        const codigo = mat.codigo?.toLowerCase() || '';
                                        const prov = mat.proveedor?.nombreEmpresa?.toLowerCase() || ''; 
                                        
                                        return nombre.includes(term) || color.includes(term) || codigo.includes(term) || prov.includes(term);
                                    }).map(mat => (
                                        <li 
                                            key={mat._id}
                                            onClick={() => {
                                                setMaterialSeleccionado(mat._id);
                                                setSearchTermMaterial(`${mat.nombre} ${mat.color ? `- ${mat.color}` : ''} ${mat.codigo ? `[${mat.codigo}]` : ''}`);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="px-4 py-2 hover:bg-orange-50 cursor-pointer text-sm border-b last:border-b-0"
                                        >
                                            <div className="font-medium text-gray-800">
                                                {mat.nombre} {mat.color && <span className="text-gray-500 text-xs">({mat.color})</span>}
                                            </div>
                                            <div className="text-xs text-gray-500 flex justify-between">
                                                <span>Stock: {mat.cantidad} | {mat.codigo || 'S/C'}</span>
                                                <span className="font-semibold text-orange-600">{mat.precioCompra} Bs</span>
                                            </div>
                                        </li>
                                    ))}
                                    {materiales.filter(mat => {
                                        const term = searchTermMaterial.toLowerCase();
                                        const nombre = mat.nombre?.toLowerCase() || '';
                                        const color = mat.color?.toLowerCase() || '';
                                        const codigo = mat.codigo?.toLowerCase() || '';
                                        const prov = mat.proveedor?.nombreEmpresa?.toLowerCase() || ''; 
                                        
                                        return nombre.includes(term) || color.includes(term) || codigo.includes(term) || prov.includes(term);
                                    }).length === 0 && (
                                        <li className="px-4 py-2 text-gray-500 text-sm italic">No se encontraron materiales</li>
                                    )}
                                </ul>
                            )}
                        </div>
                        <div className="w-32">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad</label>
                            <input 
                                type="number" 
                                min="1"
                                value={cantidadMaterialSeleccionada}
                                onChange={(e) => setCantidadMaterialSeleccionada(parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                        <button 
                            onClick={agregarMaterialAOrden}
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
                            disabled={!materialSeleccionado}
                        >
                            + Agregar
                        </button>
                    </div>

                    {/* Tabla de Materiales Agregados */}
                    {nuevaOrden.materiales.length > 0 ? (
                        <div className="overflow-hidden border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cód/Prov</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Costo Unit.</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cant.</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {nuevaOrden.materiales.map((item, index) => {
                                        const mat = materiales.find(m => m._id === item.material);
                                        const precio = mat ? (mat.precioCompra || 0) : 0;
                                        return (
                                            <tr key={index}>
                                                <td className="px-4 py-2 text-sm text-gray-900">{mat ? mat.nombre : 'Desconocido'}</td>
                                                <td className="px-4 py-2 text-sm text-gray-500">
                                                    {mat && mat.color ? (
                                                        <span className="flex items-center gap-1">
                                                            <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: mat.color }}></span>
                                                            <span className="text-xs">{mat.color}</span>
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-500">
                                                    {mat ? (
                                                        <div className="flex flex-col text-xs">
                                                            <span className="font-semibold">{mat.codigo || 'S/C'}</span>
                                                            <span className="text-gray-400">{mat.proveedor?.nombreEmpresa || '-'}</span>
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-600 text-right">{precio} Bs</td>
                                                <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.cantidad}</td>
                                                <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">{(precio * item.cantidad).toFixed(2)} Bs</td>
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        onClick={() => eliminarMaterialDeOrden(item.material)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan="5" className="px-4 py-2 text-right font-bold text-gray-700">Total Materiales:</td>
                                        <td className="px-4 py-2 text-right font-bold text-orange-600">{nuevaOrden.precioCompra.toFixed(2)} Bs</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm italic text-center py-4">No has agregado materiales aún.</p>
                    )}
                  </div>

                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={guardarOrden}
                      className="bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition duration-200 font-semibold"
                    >
                      {editingOrden ? 'Guardar Cambios' : 'Crear Orden de Fabricación'}
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition duration-200 font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Órdenes de Fabricación */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Órdenes de Fabricación</h2>
                {loading ? <p>Cargando...</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ordenesFiltradas.map((orden) => (
                          <tr key={orden._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-orange-600">
                              #{orden.numeroOrden ? orden.numeroOrden.toString().padStart(3, '0') : '---'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {orden.nombre}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {orden.cantidad}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-orange-600 h-2.5 rounded-full"
                                  style={{ width: `${orden.progreso}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 mt-1">{orden.progreso}%</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${orden.estado === 'Completado' ? 'bg-green-100 text-green-800' :
                                  orden.estado === 'En Progreso' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'}`}>
                                {orden.estado}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                              <div className="flex justify-center space-x-2">
                                {orden.estado === 'Pendiente' && (
                                  <button
                                    onClick={() => iniciarProduccionAutomatica(orden._id)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Iniciar Producción"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  </button>
                                )}
                                {orden.estado === 'En Progreso' && (
                                  <button
                                    onClick={() => abrirModalConfirmacion(orden)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Confirmar Producción"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  </button>
                                )}
                                {(orden.estado === 'Pendiente' || orden.estado === 'En Progreso') && (
                                    <button
                                        onClick={() => abrirModalEditar(orden)}
                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Editar Orden"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                )}
                                {(orden.estado === 'Completado') && (
                                    <button
                                        onClick={() => setViewingOrden(orden)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Ver Detalles"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'materiales' && (
            <div className="space-y-6">
              {/* Formulario de Nuevo Material */}
              {showForm && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Nuevo Material</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                      <input
                        type="text"
                        value={nuevoMaterial.nombre}
                        onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, nombre: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                      <input
                        type="text"
                        value={nuevoMaterial.categoria}
                        onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, categoria: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="ej. Maderas"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad Inicial</label>
                      <input
                        type="number"
                        value={nuevoMaterial.cantidad}
                        onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, cantidad: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Precio Compra</label>
                      <input
                        type="number"
                        value={nuevoMaterial.precioCompra}
                        onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, precioCompra: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Imagen</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, imagen: e.target.files[0] })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={agregarMaterial}
                      className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition duration-200 font-semibold"
                    >
                      Guardar Material
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition duration-200 font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Inventario de Materiales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {materialesFiltrados.map((material) => (
                    <div key={material._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg text-gray-800">{material.nombre}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${material.cantidad > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {material.cantidad > 0 ? 'Disponible' : 'Agotado'}
                        </span>
                      </div>
                      
                      {/* Imagen del Material */}
                      {material.imagen && (
                        <div className="mb-4 w-full h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                           <img 
                              src={`http://localhost:5000${material.imagen}`} 
                              alt={material.nombre} 
                              className="w-full h-full object-contain"
                           />
                        </div>
                      )}

                      <p className="text-sm text-gray-500 mb-4">{material.categoria}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Stock:</span>
                          <span className="font-medium">{material.cantidad}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Precio Compra:</span>
                          <span className="font-medium">{material.precioCompra} Bs</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'maquinas' && (
            <div className="space-y-6">
              {/* Formulario de Nueva Máquina */}
              {showForm && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Nueva Máquina o Equipo</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                      <input
                        type="text"
                        value={nuevaMaquina.nombre}
                        onChange={(e) => setNuevaMaquina({ ...nuevaMaquina, nombre: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej. Sierra Circular"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
                      <input
                        type="text"
                        value={nuevaMaquina.tipo}
                        onChange={(e) => setNuevaMaquina({ ...nuevaMaquina, tipo: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej. Corte"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Costo (Bs)</label>
                      <input
                        type="number"
                        min="0"
                        value={nuevaMaquina.costo}
                        onChange={(e) => setNuevaMaquina({ ...nuevaMaquina, costo: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estado Inicial</label>
                      <select
                        value={nuevaMaquina.estado}
                        onChange={(e) => setNuevaMaquina({ ...nuevaMaquina, estado: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Operativa">Operativa</option>
                        <option value="En mantenimiento">En mantenimiento</option>
                        <option value="Fuera de servicio">Fuera de servicio</option>
                        <option value="En revisión">En revisión</option>
                        <option value="Necesita reparación">Necesita reparación</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={agregarMaquina}
                      className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold"
                    >
                      Guardar Máquina
                    </button>
                    <button
                      onClick={() => setShowForm(false)}
                      className="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition duration-200 font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Estado de Maquinaria</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {maquinasFiltradas.map((maquina) => (
                    <div key={maquina._id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-800">{maquina.nombre}</h3>
                          <p className="text-sm text-gray-500">{maquina.tipo}</p>
                          <p className="text-xs text-gray-400">Costo: Bs. {maquina.costo || 0}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-3 py-1 text-xs rounded-full ${maquina.estado === 'Operativa' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {maquina.estado}
                          </span>
                          <select
                            value={maquina.estado}
                            onChange={(e) => cambiarEstadoMaquina(maquina._id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="Operativa">Operativa</option>
                            <option value="En mantenimiento">En mantenimiento</option>
                            <option value="Fuera de servicio">Fuera de servicio</option>
                            <option value="En revisión">En revisión</option>
                            <option value="Necesita reparación">Necesita reparación</option>
                          </select>
                        </div>
                      </div>
                    <div className="text-sm">
                        <p className="text-gray-500">Último Mantenimiento</p>
                        <p className="font-medium">{new Date(maquina.ultimoMantenimiento).toLocaleDateString()}</p>
                    </div>
                  </div>

                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Modal de Finalización de Producción */}
          {showCompletionModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                      <h2 className="text-xl font-bold mb-4 text-gray-800">Finalizar Producción</h2>
                      <p className="text-gray-600 mb-4 text-sm">
                          Complete los datos para registrar el producto terminado en el inventario.
                      </p>
                      
                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Descripción del Producto</label>
                              <input 
                                  type="text" 
                                  className="w-full border rounded px-3 py-2 mt-1"
                                  value={datosCompletados.descripcion}
                                  onChange={(e) => setDatosCompletados({...datosCompletados, descripcion: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Categoría</label>
                              <input 
                                  type="text" 
                                  className="w-full border rounded px-3 py-2 mt-1"
                                  value={datosCompletados.categoria}
                                  onChange={(e) => setDatosCompletados({...datosCompletados, categoria: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700">Precio de Venta Final (Bs)</label>
                              <input 
                                  type="number" 
                                  className="w-full border rounded px-3 py-2 mt-1"
                                  value={datosCompletados.precioVenta}
                                  onChange={(e) => setDatosCompletados({...datosCompletados, precioVenta: parseFloat(e.target.value) || 0})}
                              />
                          </div>
                      </div>

                      <div className="flex justify-end space-x-3 mt-6">
                          <button 
                              onClick={() => setShowCompletionModal(false)}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={confirmarProduccion}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                              Finalizar y Añadir al Inventario
                          </button>
                      </div>
                  </div>
              </div>
          )}



      {/* Modal de Detalles de Producción */}
      {viewingOrden && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Detalles de Fabricación</h2>
                <p className="text-gray-500">Orden #{viewingOrden.numeroOrden}</p>
              </div>
              <button 
                onClick={() => setViewingOrden(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Información General</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Producto:</span> {viewingOrden.nombre}</p>
                  <p><span className="font-medium">Cantidad Producida:</span> {viewingOrden.cantidad}</p>
                  <p><span className="font-medium">Estado:</span> 
                    <span className={`ml-2 inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${
                      viewingOrden.estado === 'Completado' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {viewingOrden.estado}
                    </span>
                  </p>
                  <p><span className="font-medium">Fecha Finalización:</span> {new Date(viewingOrden.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-800 mb-3">Tiempos de Producción</h3>
                <div className="space-y-2 text-orange-900">
                   <p><span className="font-medium">Tiempo Estimado:</span> {viewingOrden.tiempoEstimado} días</p>
                   {/* Calcular tiempo real aproximado si existe fechaInicio y updatedAt (para completados) */}
                   <p><span className="font-medium">Tiempo Transcurrido:</span> {
                     viewingOrden.tiempoTranscurrido 
                        ? `${(viewingOrden.tiempoTranscurrido / 24).toFixed(1)} días (${viewingOrden.tiempoTranscurrido.toFixed(1)} horas)` 
                        : 'N/A'
                   }</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-4 text-lg">Materia Prima Utilizada</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prov. / Código</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cant. Usada</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {viewingOrden.materiales.map((item, index) => {
                                const matInfo = item.material; // Populated object
                                return (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {matInfo ? matInfo.nombre : 'Material Eliminado'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {matInfo ? matInfo.categoria : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {matInfo && matInfo.color ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: matInfo.color }}></span>
                                                    {matInfo.color}
                                                </span>
                                            ) : '-'}
                                        </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {matInfo ? (
                                                <div className="flex flex-col">
                                                    <span>{matInfo.proveedor ? matInfo.proveedor.nombreEmpresa : 'Sin Prov.'}</span>
                                                    <span className="text-xs text-gray-400">{matInfo.codigo || 'S/C'}</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                                            {item.cantidad}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t">
                <button 
                  onClick={() => setViewingOrden(null)}
                  className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  Cerrar
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
    </div>
  );
};

export default FabricacionPage;
