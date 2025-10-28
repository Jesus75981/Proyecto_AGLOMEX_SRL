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

const VentasPage = ({ userRole }) => {
  const navigate = useNavigate();
  
  // ✅ CORREGIDO: Volver al HOME (menú principal)
  const volverAlHome = () => {
    navigate('/home');
  };

  // Estados para el módulo de ventas
  const [searchTerm, setSearchTerm] = useState('');
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);

  // Cargar datos desde APIs al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);

        // Cargar productos
        const productosData = await apiFetch('/productos');
        setProductos(productosData);

        // Cargar clientes
        const clientesData = await apiFetch('/clientes');
        setClientes(clientesData);

        // Cargar ventas
        const ventasData = await apiFetch('/ventas');
        setVentas(ventasData);

      } catch (error) {
        console.error('Error al cargar datos:', error);
        alert('Error al cargar datos desde el servidor');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Función para generar numFactura único
  const generarNumFactura = () => {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `FACT-${year}${month}${day}-${random}`;
  };

  const [nuevaVenta, setNuevaVenta] = useState({
    cliente: '',
    producto: '',
    cantidad: 1,
    precio: 0,
    fecha: new Date().toISOString().split('T')[0],
    metodoPago: 'Efectivo',
    numFactura: generarNumFactura(),
    observaciones: ''
  });

  const [errors, setErrors] = useState({});
  const [clienteErrors, setClienteErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [productoSearchTerm, setProductoSearchTerm] = useState('');
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);
  const [clienteSearchTerm, setClienteSearchTerm] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [loading, setLoading] = useState(false);
  const [keepClientData, setKeepClientData] = useState(false);
  const [showCreateClientForm, setShowCreateClientForm] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    empresa: '',
    direccion: '',
    telefono: '',
    email: '',
    nit: '',
    ci: ''
  });

  // Productos predefinidos con precios (temporal hasta conectar con API)
  const productosPredefinidos = [
    { nombre: 'Silla Ejecutiva', precio: 150 },
    { nombre: 'Mesa de Centro', precio: 200 },
    { nombre: 'Sofá 3 Plazas', precio: 500 },
    { nombre: 'Estantería Moderna', precio: 300 },
    { nombre: 'Escritorio Oficina', precio: 250 },
    { nombre: 'Cama Queen Size', precio: 800 },
    { nombre: 'Ropero 3 Puertas', precio: 450 },
    { nombre: 'Mesa de Comedor', precio: 600 }
  ];

  // Función de búsqueda
  const ventasFiltradas = ventas.filter(venta =>
    (venta.cliente?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (venta.productos && venta.productos.length > 0 ? (venta.productos[0].producto?.nombre || '') : '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (venta.estado || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Productos filtrados para el dropdown searchable (usando productos de API)
  const productosFiltrados = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(productoSearchTerm.toLowerCase())
  );

  // ✅ VALIDACIONES COMPLETAS
  const validarVenta = () => {
    const nuevosErrores = {};

    // Cliente es opcional ahora
    if (nuevaVenta.cliente.trim() && nuevaVenta.cliente.trim().length < 3) {
      nuevosErrores.cliente = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!nuevaVenta.producto.trim()) {
      nuevosErrores.producto = 'El producto es requerido';
    }

    if (nuevaVenta.cantidad <= 0) {
      nuevosErrores.cantidad = 'La cantidad debe ser mayor a 0';
    } else if (nuevaVenta.cantidad > 100) {
      nuevosErrores.cantidad = 'La cantidad no puede ser mayor a 100';
    }

    if (nuevaVenta.precio <= 0) {
      nuevosErrores.precio = 'El precio debe ser mayor a 0';
    } else if (nuevaVenta.precio > 10000) {
      nuevosErrores.precio = 'El precio no puede ser mayor a $10,000';
    }

    if (!nuevaVenta.fecha) {
      nuevosErrores.fecha = 'La fecha es requerida';
    } else {
      const fechaSeleccionada = new Date(nuevaVenta.fecha);
      const hoy = new Date();
      if (fechaSeleccionada > hoy) {
        nuevosErrores.fecha = 'La fecha no puede ser futura';
      }
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // ✅ VALIDACIONES PARA FORMULARIO DE CLIENTE
  const validarCliente = () => {
    const nuevosErrores = {};

    if (!nuevoCliente.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es requerido';
    } else if (nuevoCliente.nombre.trim().length < 3) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 3 caracteres';
    } else if (nuevoCliente.nombre.trim().length > 100) {
      nuevosErrores.nombre = 'El nombre no puede tener más de 100 caracteres';
    }

    if (!nuevoCliente.direccion.trim()) {
      nuevosErrores.direccion = 'La dirección es requerida';
    } else if (nuevoCliente.direccion.trim().length < 10) {
      nuevosErrores.direccion = 'La dirección debe tener al menos 10 caracteres';
    }

    if (!nuevoCliente.telefono.trim()) {
      nuevosErrores.telefono = 'El teléfono es requerido';
    } else if (!/^[0-9+\-\s()]{7,15}$/.test(nuevoCliente.telefono.trim())) {
      nuevosErrores.telefono = 'El teléfono debe tener entre 7 y 15 caracteres numéricos';
    }

    if (nuevoCliente.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoCliente.email)) {
      nuevosErrores.email = 'El email debe tener un formato válido';
    }

    if (nuevoCliente.nit && !/^[0-9]{7,15}$/.test(nuevoCliente.nit)) {
      nuevosErrores.nit = 'El NIT debe contener solo números (7-15 dígitos)';
    }

    if (nuevoCliente.ci && !/^[0-9]{7,15}$/.test(nuevoCliente.ci)) {
      nuevosErrores.ci = 'El CI debe contener solo números (7-15 dígitos)';
    }

    setClienteErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Actualizar precio cuando se selecciona producto
  const handleProductoChange = (productoNombre) => {
    const producto = productos.find(p => p.nombre === productoNombre);
    setNuevaVenta({
      ...nuevaVenta,
      producto: productoNombre,
      precio: producto ? producto.precio : 0
    });
  };

  // Función para crear un nuevo cliente
  const crearCliente = async () => {
    if (!validarCliente()) return;

    try {
      const clienteData = {
        nombre: nuevoCliente.nombre.trim(),
        empresa: nuevoCliente.empresa.trim() || '',
        direccion: nuevoCliente.direccion.trim(),
        telefono: nuevoCliente.telefono.trim(),
        email: nuevoCliente.email.trim() || '',
        nit: nuevoCliente.nit.trim() || '',
        ci: nuevoCliente.ci.trim() || ''
      };

      const clienteCreado = await apiFetch('/clientes', {
        method: 'POST',
        body: JSON.stringify(clienteData)
      });

      // Actualizar lista de clientes localmente
      setClientes([...clientes, clienteCreado]);

      // Limpiar formulario de cliente
      setNuevoCliente({
        nombre: '',
        empresa: '',
        direccion: '',
        telefono: '',
        email: '',
        nit: '',
        ci: ''
      });
      setClienteErrors({});
      setShowCreateClientForm(false);

      // Mostrar mensaje de éxito
      alert('✅ Cliente creado exitosamente');

      return clienteCreado;
    } catch (error) {
      console.error('Error al crear cliente:', error);
      alert(`Error al crear cliente: ${error.message}`);
      throw error;
    }
  };

  // ✅ AGREGAR NUEVA VENTA
  const agregarVenta = async () => {
    if (!validarVenta()) return;

    try {
      // Buscar el producto seleccionado para obtener su ID
      const productoSeleccionado = productos.find(p => p.nombre === nuevaVenta.producto);

      if (!productoSeleccionado) {
        alert('Producto no encontrado. Por favor, selecciona un producto válido.');
        return;
      }

      let clienteSeleccionado = null;

      // Solo buscar o crear cliente si se proporcionó un nombre de cliente
      if (nuevaVenta.cliente.trim()) {
        clienteSeleccionado = clientes.find(c => c.nombre === nuevaVenta.cliente);

        // Si no se encuentra el cliente, crearlo automáticamente
        if (!clienteSeleccionado) {
          try {
            // Crear cliente automáticamente con datos básicos
            const clienteData = {
              nombre: nuevaVenta.cliente.trim(),
              empresa: '',
              direccion: 'Dirección por definir',
              telefono: 'Teléfono por definir',
              email: '',
              nit: '',
              ci: ''
            };

            const clienteCreado = await apiFetch('/clientes', {
              method: 'POST',
              body: JSON.stringify(clienteData)
            });

            // Actualizar lista de clientes localmente
            setClientes([...clientes, clienteCreado]);
            clienteSeleccionado = clienteCreado;

            // Mostrar mensaje informativo
            alert(`✅ Cliente "${nuevaVenta.cliente}" creado automáticamente con datos básicos. Puedes actualizar su información más tarde.`);

          } catch (error) {
            console.error('Error al crear cliente automáticamente:', error);
            alert(`Error al crear cliente automáticamente: ${error.message}`);
            return;
          }
        }
      }

      const ventaData = {
        numVenta: Date.now(), // Generar número único de venta
        cliente: clienteSeleccionado ? clienteSeleccionado._id : null, // ID del cliente o null si no hay cliente
        productos: [{
          producto: productoSeleccionado._id, // ID del producto
          cantidad: nuevaVenta.cantidad,
          precioUnitario: nuevaVenta.precio,
          precioTotal: nuevaVenta.cantidad * nuevaVenta.precio
        }],
        fecha: nuevaVenta.fecha,
        metodoPago: nuevaVenta.metodoPago,
        numFactura: nuevaVenta.numFactura,
        observaciones: nuevaVenta.observaciones,
        estado: 'Pendiente',
        vendedor: userRole || 'usuario'
      };

      // Enviar venta al backend
      const nuevaVentaGuardada = await apiFetch('/ventas', {
        method: 'POST',
        body: JSON.stringify(ventaData)
      });

      // Actualizar estado local
      setVentas([...ventas, nuevaVentaGuardada]);

      // Limpiar formulario
      setNuevaVenta({
        cliente: '',
        producto: '',
        cantidad: 1,
        precio: 0,
        fecha: new Date().toISOString().split('T')[0],
        metodoPago: 'Efectivo',
        numFactura: generarNumFactura(),
        observaciones: ''
      });
      setProductoSearchTerm('');
      setErrors({});
      setShowForm(false);

      // Mostrar mensaje de éxito
      alert('✅ Venta registrada exitosamente');
    } catch (error) {
      console.error('Error al registrar venta:', error);
      alert(`Error al registrar la venta: ${error.message}`);
    }
  };

  // Cambiar estado de venta
  const cambiarEstadoVenta = async (id, nuevoEstado) => {
    try {
      // Aquí podrías hacer una llamada a la API para actualizar el estado en el backend
      // Por ahora, solo actualizamos localmente
      setVentas(ventas.map(venta =>
        venta._id === id ? { ...venta, estado: nuevoEstado } : venta
      ));
      alert(`Estado de venta actualizado a ${nuevoEstado}`);
    } catch (error) {
      console.error('Error al cambiar estado de venta:', error);
      alert('Error al actualizar el estado de la venta');
    }
  };

  // Eliminar venta (solo admin)
  const eliminarVenta = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta venta?')) {
      setVentas(ventas.filter(venta => venta.id !== id));
      alert('🗑️ Venta eliminada correctamente');
    }
  };

  // Calcular totales
  const totalVentas = ventas.reduce((sum, venta) => {
    if (venta.productos && venta.productos.length > 0) {
      return sum + venta.productos.reduce((subSum, producto) => subSum + (producto.precioTotal || 0), 0);
    }
    return sum;
  }, 0);
  const ventasCompletadas = ventas.filter(v => v.estado === 'Completada').length;
  const ventasPendientes = ventas.filter(v => v.estado === 'Pendiente').length;

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
              <span className="text-sm text-gray-600">Módulo de Ventas</span>
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
            <h1 className="text-4xl font-bold text-green-600 mb-2">Módulo de Ventas</h1>
            <p className="text-gray-600 text-lg">Gestión completa de ventas y clientes</p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Total Ventas</h3>
                  <p className="text-2xl font-bold text-gray-800">Bs. {totalVentas.toLocaleString()}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <span className="text-green-600 text-xl">💰</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Ventas Totales</h3>
                  <p className="text-2xl font-bold text-gray-800">{ventas.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <span className="text-blue-600 text-xl">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Completadas</h3>
                  <p className="text-2xl font-bold text-gray-800">{ventasCompletadas}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <span className="text-purple-600 text-xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Pendientes</h3>
                  <p className="text-2xl font-bold text-gray-800">{ventasPendientes}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <span className="text-yellow-600 text-xl">⏳</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controles Superiores */}
          <div className="flex justify-between items-center mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por cliente, producto o estado..."
                value={searchTerm ?? ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-80"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                🔍
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowCreateClientForm(!showCreateClientForm)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold"
              >
                {showCreateClientForm ? 'Cancelar Cliente' : '+ Nuevo Cliente'}
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200 font-semibold"
              >
                {showForm ? 'Cancelar Venta' : '+ Nueva Venta'}
              </button>
            </div>
          </div>

          {/* Formulario de Crear Cliente */}
          {showCreateClientForm && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Crear Nuevo Cliente</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                  <input
                    type="text"
                    value={nuevoCliente.nombre}
                    onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      clienteErrors.nombre ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nombre completo del cliente"
                  />
                  {clienteErrors.nombre && <p className="text-red-500 text-sm mt-1">{clienteErrors.nombre}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Empresa / Institución</label>
                  <input
                    type="text"
                    value={nuevoCliente.empresa}
                    onChange={(e) => setNuevoCliente({...nuevoCliente, empresa: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nombre de la empresa (opcional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dirección *</label>
                  <input
                    type="text"
                    value={nuevoCliente.direccion}
                    onChange={(e) => setNuevoCliente({...nuevoCliente, direccion: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      clienteErrors.direccion ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Dirección completa"
                  />
                  {clienteErrors.direccion && <p className="text-red-500 text-sm mt-1">{clienteErrors.direccion}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                  <input
                    type="text"
                    value={nuevoCliente.telefono}
                    onChange={(e) => setNuevoCliente({...nuevoCliente, telefono: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      clienteErrors.telefono ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Número de teléfono"
                  />
                  {clienteErrors.telefono && <p className="text-red-500 text-sm mt-1">{clienteErrors.telefono}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={nuevoCliente.email}
                    onChange={(e) => setNuevoCliente({...nuevoCliente, email: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      clienteErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="correo@ejemplo.com"
                  />
                  {clienteErrors.email && <p className="text-red-500 text-sm mt-1">{clienteErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">NIT</label>
                  <input
                    type="text"
                    value={nuevoCliente.nit}
                    onChange={(e) => setNuevoCliente({...nuevoCliente, nit: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      clienteErrors.nit ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Número de NIT"
                  />
                  {clienteErrors.nit && <p className="text-red-500 text-sm mt-1">{clienteErrors.nit}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Carnet de Identidad</label>
                  <input
                    type="text"
                    value={nuevoCliente.ci}
                    onChange={(e) => setNuevoCliente({...nuevoCliente, ci: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      clienteErrors.ci ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Número de CI"
                  />
                  {clienteErrors.ci && <p className="text-red-500 text-sm mt-1">{clienteErrors.ci}</p>}
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={async () => {
                    try {
                      const clienteCreado = await crearCliente();
                      // Después de crear el cliente, intentar registrar la venta nuevamente
                      await agregarVenta();
                    } catch (error) {
                      // Error ya manejado en crearCliente
                    }
                  }}
                  className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold shadow-md"
                >
                  Crear Cliente y Registrar Venta
                </button>
                <button
                  onClick={() => setShowCreateClientForm(false)}
                  className="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition duration-200 font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Formulario de Nueva Venta */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Registrar Nueva Venta</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cliente (Opcional)</label>
                  <input
                    type="text"
                    value={nuevaVenta.cliente}
                    onChange={(e) => setNuevaVenta({...nuevaVenta, cliente: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.cliente ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nombre completo del cliente (opcional)"
                  />
                  {errors.cliente && <p className="text-red-500 text-sm mt-1">{errors.cliente}</p>}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Producto *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={productoSearchTerm}
                      onChange={(e) => {
                        setProductoSearchTerm(e.target.value);
                        setShowProductoDropdown(true);
                      }}
                      onFocus={() => setShowProductoDropdown(true)}
                      onBlur={() => setTimeout(() => setShowProductoDropdown(false), 200)}
                      placeholder="Buscar producto..."
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.producto ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {showProductoDropdown && productosFiltrados.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {productosFiltrados.map((producto, index) => (
                          <div
                            key={index}
                            onClick={() => {
                              setProductoSearchTerm(producto.nombre);
                              handleProductoChange(producto.nombre);
                              setShowProductoDropdown(false);
                            }}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium">{producto.nombre}</div>
                            <div className="text-sm text-gray-500">Bs. {producto.precio}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.producto && <p className="text-red-500 text-sm mt-1">{errors.producto}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={nuevaVenta.cantidad}
                    onChange={(e) => setNuevaVenta({...nuevaVenta, cantidad: parseInt(e.target.value) || 1})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.cantidad ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.cantidad && <p className="text-red-500 text-sm mt-1">{errors.cantidad}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Precio Unitario *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max="10000"
                    value={nuevaVenta.precio}
                    onChange={(e) => setNuevaVenta({...nuevaVenta, precio: parseFloat(e.target.value) || 0})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.precio ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.precio && <p className="text-red-500 text-sm mt-1">{errors.precio}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha *</label>
                  <input
                    type="date"
                    value={nuevaVenta.fecha}
                    onChange={(e) => setNuevaVenta({...nuevaVenta, fecha: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.fecha ? 'border-red-500' : 'border-gray-300'
                    }`}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.fecha && <p className="text-red-500 text-sm mt-1">{errors.fecha}</p>}
                </div>

                <div className="flex items-end">
                  <div className="bg-gray-100 p-4 rounded-lg w-full">
                    <p className="text-sm text-gray-600">Total a pagar:</p>
                      <p className="text-2xl font-bold text-green-600">
                      Bs. {(nuevaVenta.cantidad * nuevaVenta.precio).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={agregarVenta}
                  className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition duration-200 font-semibold shadow-md"
                >
                  Registrar Venta
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setErrors({});
                  }}
                  className="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition duration-200 font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de Ventas */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Historial de Ventas</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ventasFiltradas.map((venta, index) => (
                    <tr key={venta._id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{venta.numVenta || venta._id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {venta.cliente?.nombre || 'Sin cliente'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {venta.productos?.[0]?.producto?.nombre || 'Sin producto'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {venta.productos?.[0]?.cantidad || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        Bs. {venta.productos?.[0]?.precioUnitario || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                        Bs. {venta.productos?.[0]?.precioTotal || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(venta.fecha).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          venta.estado === 'Completada'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {venta.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {venta.estado === 'Pendiente' && (
                            <button
                              onClick={() => cambiarEstadoVenta(venta._id, 'Completada')}
                              className="text-green-600 hover:text-green-900 text-xs"
                            >
                              Completar
                            </button>
                          )}
                          {userRole === 'admin' && (
                            <button
                              onClick={() => eliminarVenta(venta._id)}
                              className="text-red-600 hover:text-red-900 text-xs"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {ventasFiltradas.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No se encontraron ventas que coincidan con la búsqueda' : 'No hay ventas registradas'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentasPage;