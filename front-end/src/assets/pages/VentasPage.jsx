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

  // Estados para búsqueda de productos
  const [productoSearchTerm, setProductoSearchTerm] = useState('');
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);

  // Filtrar productos basado en el término de búsqueda
  useEffect(() => {
    if (productoSearchTerm.trim() === '') {
      setProductosFiltrados([]);
    } else {
      const filtrados = productos.filter(producto => {
        const term = productoSearchTerm.toLowerCase();
        return (
          producto.nombre.toLowerCase().includes(term) ||
          (producto.codigo && producto.codigo.toLowerCase().includes(term)) ||
          (producto.idProductoTienda && producto.idProductoTienda.toLowerCase().includes(term))
        );
      });
      setProductosFiltrados(filtrados);
    }
  }, [productoSearchTerm, productos]);

  // Cargar datos desde APIs al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
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
    productos: [],
    fecha: new Date().toISOString().split('T')[0],
    metodosPago: [], // Array de pagos múltiples
    metodoEntrega: 'Recojo en Tienda', // ✅ Default delivery method
    numFactura: generarNumFactura(),
    observaciones: '',
    observaciones: '',
    descuento: 0, // Global discount
    tipoComprobante: 'Recibo' // Default informal
  });

  // Estados temporales para agregar productos al carrito
  const [productoTemporal, setProductoTemporal] = useState({
    productoId: '',
    productoNombre: '',
    cantidad: 1,
    precioUnitario: ''
  });

  // Estado temporal para pagos múltiples
  const [pagoTemporal, setPagoTemporal] = useState({
    metodo: 'Efectivo',
    monto: '',
    cuentaId: '' // Para transferencias
  });

  const [errors, setErrors] = useState({});
  const [clienteErrors, setClienteErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [showCreateClientForm, setShowCreateClientForm] = useState(false);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false); // Estado para dropdown de clientes
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    empresa: '',
    direccion: '',
    telefono: '',
    email: '',
    nit: '',
    ci: '',
    ubicacion: ''
  });

  // Función de búsqueda
  const ventasFiltradas = ventas.filter(venta =>
    (venta.cliente?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (venta.productos && venta.productos.some(p => (p.producto?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()))) ||
    (venta.estado || '').toLowerCase().includes(searchTerm.toLowerCase())
  );



  // --- Tabs de Navegación ---
  const [activeTab, setActiveTab] = useState('ventas'); // 'ventas' | 'clientes'
  const [clienteEditing, setClienteEditing] = useState(null); // Cliente en edición
  // --- Estado para Modal de Detalles ---
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Estados para cuentas bancarias (Para Transferencias)
  const [activeBankAccounts, setActiveBankAccounts] = useState([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const cuentas = await apiFetch('/finanzas/cuentas');
        setActiveBankAccounts(cuentas || []);
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };
    fetchAccounts();
  }, []);

  // Función para abrir modal de detalles
  const verDetallesVenta = (venta) => {
    setSelectedVenta(venta);
    setShowDetailModal(true);
  };

  // Función para manejar la edición de cliente
  const handleEditCliente = (cliente) => {
    setNuevoCliente({
      nombre: cliente.nombre,
      empresa: cliente.empresa || '',
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      email: cliente.email || '',
      nit: cliente.nit || '',
      ci: cliente.ci || '',
      ubicacion: cliente.ubicacion || ''
    });
    setClienteEditing(cliente);
    setShowCreateClientForm(true);
  };

  // Función para eliminar cliente
  const handleDeleteCliente = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) return;

    try {
      await apiFetch(`/clientes/${id}`, { method: 'DELETE' });
      setClientes(clientes.filter(c => c._id !== id));
      alert('Cliente eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      alert('Error al eliminar cliente: ' + error.message);
    }
  };

  // Función para actualizar cliente
  const actualizarCliente = async () => {
    if (!validarCliente()) return;

    try {
      const clienteData = { ...nuevoCliente };

      const clienteActualizado = await apiFetch(`/clientes/${clienteEditing._id}`, {
        method: 'PUT',
        body: JSON.stringify(clienteData)
      });

      setClientes(clientes.map(c => c._id === clienteEditing._id ? clienteActualizado : c));

      // Reset form
      setNuevoCliente({
        nombre: '',
        empresa: '',
        direccion: '',
        telefono: '',
        email: '',
        nit: '',
        ci: '',
        ubicacion: ''
      });
      setClienteEditing(null);
      setShowCreateClientForm(false);
      alert('Cliente actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      alert('Error al actualizar cliente: ' + error.message);
    }
  };

  // Wrapper para guardar (Crear o Actualizar)
  const handleSaveCliente = () => {
    if (clienteEditing) {
      actualizarCliente();
    } else {
      crearCliente();
    }
  };

  // ✅ VALIDACIONES COMPLETAS
  const validarVenta = () => {
    const nuevosErrores = {};

    // Cliente es opcional ahora
    if (nuevaVenta.cliente.trim() && nuevaVenta.cliente.trim().length < 3) {
      nuevosErrores.cliente = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validar que haya al menos un producto
    if (!nuevaVenta.productos || nuevaVenta.productos.length === 0) {
      nuevosErrores.productos = 'Debe agregar al menos un producto';
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

  // Función para añadir producto al carrito
  const añadirProductoAlCarrito = () => {
    const productoSeleccionado = productos.find(p => p.nombre === productoSearchTerm);

    if (!productoSeleccionado) {
      alert('Producto no encontrado. Por favor, selecciona un producto válido.');
      return;
    }

    // Validar stock disponible
    if (productoTemporal.cantidad > productoSeleccionado.cantidad) {
      alert(`No hay suficiente stock para este producto. Disponible: ${productoSeleccionado.cantidad}`);
      return;
    }

    if (productoTemporal.cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    if (productoTemporal.precioUnitario <= 0) {
      alert('El precio debe ser mayor a 0');
      return;
    }

    // Verificar si el producto ya está en el carrito
    const productoExistente = nuevaVenta.productos.find(p => p.producto === productoSeleccionado._id);

    if (productoExistente) {
      // Actualizar cantidad y precio si ya existe
      const productosActualizados = nuevaVenta.productos.map(p =>
        p.producto === productoSeleccionado._id
          ? {
            ...p,
            cantidad: p.cantidad + productoTemporal.cantidad,
            precioUnitario: productoTemporal.precioUnitario,
            precioTotal: (p.cantidad + productoTemporal.cantidad) * productoTemporal.precioUnitario
          }
          : p
      );
      setNuevaVenta({ ...nuevaVenta, productos: productosActualizados });
    } else {
      // Añadir nuevo producto al carrito
      const nuevoProducto = {
        producto: productoSeleccionado._id,
        productoNombre: productoSeleccionado.nombre,
        productoCodigo: productoSeleccionado.codigo || productoSeleccionado.idProductoTienda || 'S/C',
        productoColor: productoSeleccionado.color || '-',
        cantidad: productoTemporal.cantidad,
        precioUnitario: productoTemporal.precioUnitario,
        precioTotal: productoTemporal.cantidad * productoTemporal.precioUnitario
      };
      setNuevaVenta({ ...nuevaVenta, productos: [...nuevaVenta.productos, nuevoProducto] });
    }

    // Limpiar formulario de producto
    setProductoSearchTerm('');
    setProductoTemporal({
      productoId: '',
      productoNombre: '',
      cantidad: 1,
      precioUnitario: 0 // Ensure this is reset
    });
  };

  // Agregar un método de pago a la lista
  const agregarPago = () => {
    const monto = parseFloat(pagoTemporal.monto);
    if (!monto || monto <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    const nuevoPago = {
      tipo: pagoTemporal.metodo,
      monto: monto,
      cuentaId: pagoTemporal.cuentaId // Include account ID if selected
    };

    setNuevaVenta({
      ...nuevaVenta,
      metodosPago: [...nuevaVenta.metodosPago, nuevoPago]
    });
    setPagoTemporal({ ...pagoTemporal, monto: '', cuentaId: '' }); // Clear monto and cuentaId after adding
  };

  // Quitar un pago
  const quitarPago = (index) => {
    const nuevosPagos = nuevaVenta.metodosPago.filter((_, i) => i !== index);
    setNuevaVenta({ ...nuevaVenta, metodosPago: nuevosPagos });
  };

  // Función para quitar producto de la venta
  const quitarProducto = (index) => {
    const productosActualizados = nuevaVenta.productos.filter((_, i) => i !== index);
    setNuevaVenta({ ...nuevaVenta, productos: productosActualizados });
  };

  // Calcular total de la venta
  const calcularTotal = () => {
    const subtotal = nuevaVenta.productos.reduce((total, producto) => total + producto.precioTotal, 0);
    return Math.max(0, subtotal - (parseFloat(nuevaVenta.descuento) || 0));
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

    if (nuevoCliente.nit && !/^[a-zA-Z0-9\s-]{5,20}$/.test(nuevoCliente.nit)) {
      nuevosErrores.nit = 'El NIT puede contener números y letras (5-20 caracteres)';
    }

    if (nuevoCliente.ci && !/^[a-zA-Z0-9\s-]{5,20}$/.test(nuevoCliente.ci)) {
      nuevosErrores.ci = 'El CI puede contener números y letras (5-20 caracteres)';
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
        ci: nuevoCliente.ci.trim() || '',
        ubicacion: nuevoCliente.ubicacion.trim() || ''
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

      const totalVenta = nuevaVenta.productos.reduce((sum, p) => sum + p.precioTotal, 0);

      const ventaData = {
        numVenta: Date.now(), // Generar número único de venta
        cliente: clienteSeleccionado ? clienteSeleccionado._id : null, // ID del cliente o null si no hay cliente
        productos: nuevaVenta.productos, // Usar el array de productos
        fecha: nuevaVenta.fecha,
        metodosPago: nuevaVenta.metodosPago.length > 0 ? nuevaVenta.metodosPago : [{ tipo: 'Efectivo', monto: totalVenta }], // Fallback a efectivo si no hay pagos
        metodoEntrega: nuevaVenta.metodoEntrega,
        numFactura: nuevaVenta.numFactura,
        tipoComprobante: nuevaVenta.tipoComprobante, // Send to backend
        observaciones: nuevaVenta.observaciones,
        descuento: nuevaVenta.descuento,
        estado: (nuevaVenta.metodosPago.reduce((acc, p) => acc + p.monto, 0) >= totalVenta) ? 'Pagada' : 'Pendiente',
        vendedor: userRole || 'usuario'
      };

      // Enviar venta al backend
      const nuevaVentaGuardada = await apiFetch('/ventas', {
        method: 'POST',
        body: JSON.stringify(ventaData)
      });

      // Recargar lista de ventas para obtener datos poblados (nombres de clientes/productos)
      try {
        const ventasActualizadas = await apiFetch('/ventas');
        setVentas(ventasActualizadas);
      } catch (err) {
        console.error("Error al recargar ventas:", err);
        // Fallback: add locally if fetch fails, though populated data might be missing
        setVentas([...ventas, nuevaVentaGuardada]);
      }

      setErrors({});
      setShowForm(false);

      // Mostrar mensaje de éxito
      alert('✅ Venta registrada exitosamente');

      // ✅ REDIRECCIÓN A LOGÍSTICA SI ES ENVÍO
      if (ventaData.metodoEntrega.includes('Envio')) {
        alert('📦 Redirigiendo a módulo de Logística para programar el envío...');
        navigate(`/logistica?action=create&pedidoNumero=${nuevaVentaGuardada.numVenta}`);
      }

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
  const eliminarVenta = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta venta?')) {
      try {
        await apiFetch(`/ventas/${id}`, {
          method: 'DELETE',
        });
        setVentas(ventas.filter(venta => venta._id !== id));
        alert('🗑️ Venta eliminada correctamente');
      } catch (error) {
        console.error('Error al eliminar venta:', error);
        alert(`Error al eliminar la venta: ${error.message}`);
      }
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={volverAlHome}
              className="flex items-center space-x-2 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 hover:text-green-600 transition-colors shadow-sm font-medium"
              title="Volver al Inicio"
            >
              <span className="text-xl">←</span>
              <span>Volver al Home</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Módulo de Ventas y Clientes</h1>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('ventas')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'ventas'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
            >
              Ventas
            </button>
            <button
              onClick={() => setActiveTab('clientes')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'clientes'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
            >
              Gestionar Clientes
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

        {/* --- VISTA DE VENTAS --- */}
        {activeTab === 'ventas' && (
          <>
            {/* Header Venta */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-green-600 mb-1">Nueva Venta</h1>
                <p className="text-gray-600">Registra ventas y controla el flujo de caja.</p>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por cliente, producto..."
                    value={searchTerm ?? ''}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
                  />
                  <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
                </div>

                {!showForm && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2 transform hover:scale-105"
                  >
                    <span>＋</span> Registrar Venta
                  </button>
                )}
              </div>
            </div>



            {/* Formulario de Crear Cliente */}
            {
              showCreateClientForm && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Crear Nuevo Cliente</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                      <input
                        type="text"
                        value={nuevoCliente.nombre}
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${clienteErrors.nombre ? 'border-red-500' : 'border-gray-300'
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
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, empresa: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Nombre de la empresa (opcional)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dirección *</label>
                      <input
                        type="text"
                        value={nuevoCliente.direccion}
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${clienteErrors.direccion ? 'border-red-500' : 'border-gray-300'
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
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${clienteErrors.telefono ? 'border-red-500' : 'border-gray-300'
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
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${clienteErrors.email ? 'border-red-500' : 'border-gray-300'
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
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, nit: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${clienteErrors.nit ? 'border-red-500' : 'border-gray-300'
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
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, ci: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${clienteErrors.ci ? 'border-red-500' : 'border-gray-300'
                          }`}
                        placeholder="Número de CI"
                      />
                      {clienteErrors.ci && <p className="text-red-500 text-sm mt-1">{clienteErrors.ci}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
                      <input
                        type="text"
                        value={nuevoCliente.ubicacion}
                        onChange={(e) => setNuevoCliente({ ...nuevoCliente, ubicacion: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Ubicación del cliente (opcional)"
                      />
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
              )
            }

            {/* Formulario de Nueva Venta con Carrito */}
            {
              showForm && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Registrar Nueva Venta</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cliente (Opcional)</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={nuevaVenta.cliente}
                          onChange={(e) => {
                            setNuevaVenta({ ...nuevaVenta, cliente: e.target.value });
                            setShowClienteDropdown(true);
                          }}
                          onFocus={() => setShowClienteDropdown(true)}
                          onBlur={() => setTimeout(() => setShowClienteDropdown(false), 200)}
                          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.cliente ? 'border-red-500' : 'border-gray-300'}`}
                          placeholder="Buscar o escribir nombre..."
                          autoComplete="off"
                        />
                        {/* Botón para limpiar */}
                        {nuevaVenta.cliente && (
                          <button
                            onClick={() => setNuevaVenta({ ...nuevaVenta, cliente: '' })}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                          >
                            ✕
                          </button>
                        )}

                        {/* Dropdown de Clientes */}
                        {showClienteDropdown && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {clientes
                              .filter(c => c.nombre.toLowerCase().includes((nuevaVenta.cliente || '').toLowerCase()) || (c.empresa || '').toLowerCase().includes((nuevaVenta.cliente || '').toLowerCase()))
                              .slice(0, 10) // Limit results
                              .map((cliente) => (
                                <div
                                  key={cliente._id}
                                  onMouseDown={() => {
                                    setNuevaVenta({ ...nuevaVenta, cliente: cliente.nombre });
                                    setShowClienteDropdown(false);
                                  }}
                                  className="px-4 py-2 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-800">{cliente.nombre}</div>
                                  {cliente.empresa && <div className="text-xs text-gray-500">{cliente.empresa}</div>}
                                </div>
                              ))}

                            {/* Opción para crear si no existe (visual cue, though typing works) */}
                            {clientes.filter(c => c.nombre.toLowerCase().includes((nuevaVenta.cliente || '').toLowerCase())).length === 0 && nuevaVenta.cliente && (
                              <div className="px-4 py-2 text-sm text-gray-500 italic">
                                Presiona Enter o haz clic fuera para usar "{nuevaVenta.cliente}" como nuevo cliente (o cliente casual).
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {errors.cliente && <p className="text-red-500 text-sm mt-1">{errors.cliente}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha *</label>
                      <input
                        type="date"
                        value={nuevaVenta.fecha}
                        onChange={(e) => setNuevaVenta({ ...nuevaVenta, fecha: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.fecha ? 'border-red-500' : 'border-gray-300'
                          }`}
                        max={new Date().toISOString().split('T')[0]}
                      />
                      {errors.fecha && <p className="text-red-500 text-sm mt-1">{errors.fecha}</p>}
                    </div>

                    {/* Método de Entrega */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Método de Entrega</label>
                      <select
                        value={nuevaVenta.metodoEntrega}
                        onChange={(e) => setNuevaVenta({ ...nuevaVenta, metodoEntrega: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="Recojo en Tienda">Recojo en Tienda</option>
                        <option value="Recojo en Almacen">Recojo en Almacen</option>
                        <option value="Envio Domicilio">Envío a Domicilio</option>
                        <option value="Envio Nacional">Envío Nacional</option>
                      </select>
                    </div>
                  </div>

                  {/* Selector de Productos para Carrito */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Añadir Productos al Carrito</h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          {showProductoDropdown && productosFiltrados.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {productosFiltrados.map((producto, index) => (
                                <div
                                  key={index}
                                  onClick={() => {
                                    setProductoSearchTerm(producto.nombre);
                                    setProductoTemporal({
                                      ...productoTemporal,
                                      productoId: producto._id,
                                      productoNombre: producto.nombre,
                                      precioUnitario: producto.precioVenta || producto.precioCompra || producto.precio || 0
                                    });
                                    setShowProductoDropdown(false);
                                  }}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium">{producto.nombre}</div>
                                  <div className="text-sm text-gray-500">Bs. {producto.precioVenta || producto.precio}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad *</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={productoTemporal.cantidad}
                          onChange={(e) => setProductoTemporal({ ...productoTemporal, cantidad: parseInt(e.target.value) || 1 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Precio Unitario *</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={productoTemporal.precioUnitario}
                          onChange={(e) => setProductoTemporal({ ...productoTemporal, precioUnitario: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={añadirProductoAlCarrito}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold"
                        >
                          + Añadir al Carrito
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Carrito de Compras */}
                  {nuevaVenta.productos.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Carrito de Ventas</h3>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {nuevaVenta.productos.map((item, index) => (
                              <tr key={index} className="border-t border-gray-200">
                                <td className="px-4 py-2 text-sm text-gray-500 font-mono">
                                  {item.productoCodigo || 'S/C'}
                                </td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                  {item.productoNombre}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">
                                  {item.productoColor || '-'}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">
                                  {item.cantidad}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">
                                  Bs. {item.precioUnitario.toFixed(2)}
                                </td>
                                <td className="px-4 py-2 text-sm font-semibold text-green-600">
                                  Bs. {(item.cantidad * item.precioUnitario).toFixed(2)}
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  <button
                                    onClick={() => quitarProducto(index)}
                                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                                  >
                                    🗑️ Quitar
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-gray-300">
                              <td colSpan="3" className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                                Total de la Venta:
                              </td>
                              <td className="px-4 py-3 text-lg font-bold text-green-600">
                                Bs. {calcularTotal().toFixed(2)}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Detalles Adicionales de la Venta */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Métodos de Pago</label>

                      {/* Selector y Input de Pago */}
                      <div className="flex flex-wrap gap-2 mb-3 items-end">
                        <div className="flex-1 min-w-[150px]">
                          <label className="text-xs text-gray-500">Método</label>
                          <select
                            value={pagoTemporal.metodo}
                            onChange={(e) => setPagoTemporal({ ...pagoTemporal, metodo: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-green-500"
                          >
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Tarjeta">Tarjeta</option>
                          </select>
                        </div>
                        <div className="w-32">
                          <label className="text-xs text-gray-500">Monto (Bs)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={pagoTemporal.monto}
                            onChange={(e) => setPagoTemporal({ ...pagoTemporal, monto: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-green-500"
                            placeholder="0.00"
                          />
                        </div>
                        <button
                          onClick={agregarPago}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-bold"
                        >
                          +
                        </button>
                      </div>

                      {/* Lista de Pagos Agregados */}
                      {nuevaVenta.metodosPago.length > 0 && (
                        <div className="space-y-2 mb-2">
                          {nuevaVenta.metodosPago.map((pago, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 shadow-sm text-sm">
                              <span className="font-medium text-gray-700">{pago.tipo}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-gray-900">Bs. {pago.monto.toFixed(2)}</span>
                                <button onClick={() => quitarPago(idx)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Resumen de Pagos */}
                      <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-300">
                        <div>
                          <span className="text-gray-600">Total Venta: </span>
                          <span className="font-bold">Bs. {calcularTotal().toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Pagado: </span>
                          <span className="font-bold text-blue-600">
                            Bs. {nuevaVenta.metodosPago.reduce((s, p) => s + p.monto, 0).toFixed(2)}
                          </span>
                      </div>
                    </div>
                      <div>
                          {(() => {
                            const totalPagado = nuevaVenta.metodosPago.reduce((s, p) => s + p.monto, 0);
                            const totalVenta = calcularTotal();
                            const diferencia = totalPagado - totalVenta;

                            if (diferencia > 0) {
                              return (
                                <>
                                  <span className="text-gray-600">Cambio: </span>
                                  <span className="font-bold text-green-600">
                                    Bs. {diferencia.toFixed(2)}
                                  </span>
                                </>
                              );
                            } else if (diferencia < 0) {
                              return (
                                <>
                                  <span className="text-gray-600">Saldo Pendiente: </span>
                                  <span className="font-bold text-red-600">
                                    Bs. {Math.abs(diferencia).toFixed(2)}
                                  </span>
                                </>
                              );
                            } else {
                              return null;
                            }
                          })()}
                      </div >
                    </div >

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
    <textarea
      value={nuevaVenta.observaciones}
      onChange={(e) => setNuevaVenta({ ...nuevaVenta, observaciones: e.target.value })}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
      rows="2"
      placeholder="Observaciones adicionales (opcional)"
    />
  </div>
                  </div >

  { errors.productos && <p className="text-red-500 text-sm mb-4">{errors.productos}</p> }

  < div className = "flex space-x-4" >
                    <button
                      onClick={agregarVenta}
                      disabled={nuevaVenta.productos.length === 0}
                      className={`py-3 px-6 rounded-lg transition duration-200 font-semibold shadow-md ${nuevaVenta.productos.length === 0
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                      Registrar Venta ({nuevaVenta.productos.length} productos)
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setNuevaVenta({
                          cliente: '',
                          productos: [],
                          fecha: new Date().toISOString().split('T')[0],
                          metodosPago: [],
                          metodoEntrega: 'Recojo en Tienda',
                          metodosPago: [],
                          metodoEntrega: 'Recojo en Tienda',
                          numFactura: generarNumFactura(),
                          observaciones: '',
                          tipoComprobante: 'Recibo'
                        });
                        setProductoSearchTerm('');
                        setProductoTemporal({
                          productoId: '',
                          productoNombre: '',
                          cantidad: 1,
                          precioUnitario: 0
                        });
                        setErrors({});
                      }}
                      className="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition duration-200 font-semibold"
                    >
                      Cancelar
                    </button>
                  </div >
                </div >
              )
            }

{/* Lista de Ventas */ }
<div className="bg-white rounded-xl shadow-md p-6">
  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Historial de Ventas</h2>

  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="bg-gray-50">
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productos</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Pendiente</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
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
            <td className="px-4 py-3 text-sm text-gray-500">
              {venta.productos?.map(p => `${p.producto?.nombre} (${p.cantidad})`).join(', ') || 'Sin producto'}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
              Bs. {(venta.productos?.reduce((sum, p) => sum + (p.precioTotal || 0), 0) || 0).toFixed(2)}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-red-600">
              {venta.saldoPendiente > 0 ? `Bs. ${venta.saldoPendiente.toFixed(2)}` : '-'}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
              {venta.fecha ? new Date(venta.fecha).toLocaleDateString('es-ES') : '-'}
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${venta.estado === 'Completada' || venta.estado === 'Pagada'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}>
                {venta.estado}
              </span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
              <div className="flex justify-center space-x-2">
                {/* Botón Detalles */}
                <button
                  onClick={() => verDetallesVenta(venta)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Ver Detalles"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
                {venta.estado === 'Pendiente' && (
                  <button
                    onClick={() => cambiarEstadoVenta(venta._id, 'Completada')}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Completar Venta"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                )}
                {userRole === 'admin' && (
                  <button
                    onClick={() => eliminarVenta(venta._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

{/* --- MODAL DE DETALLES DE VENTA --- */ }
{
  showDetailModal && selectedVenta && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Detalles de Venta #{selectedVenta.numVenta}</h3>
            <p className="text-sm text-gray-500">Fecha: {new Date(selectedVenta.fecha).toLocaleDateString('es-ES')} - {new Date(selectedVenta.fecha).toLocaleTimeString('es-ES')}</p>
          </div>
          <button
            onClick={() => setShowDetailModal(false)}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Info Cliente y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Información del Cliente</h4>
              {selectedVenta.cliente ? (
                <ul className="text-sm text-gray-700 space-y-1">
                  <li><span className="font-medium">Nombre:</span> {selectedVenta.cliente.nombre}</li>
                  {selectedVenta.cliente.empresa && <li><span className="font-medium">Empresa:</span> {selectedVenta.cliente.empresa}</li>}
                  {selectedVenta.cliente.nit && <li><span className="font-medium">NIT/CI:</span> {selectedVenta.cliente.nit || selectedVenta.cliente.ci}</li>}
                  <li><span className="font-medium">Teléfono:</span> {selectedVenta.cliente.telefono}</li>
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">Cliente Casual / No registrado</p>
              )}
            </div>
            <div className="text-right">
              <h4 className="font-semibold text-gray-800 mb-2">Estado de Venta</h4>
              <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${selectedVenta.estado === 'Completada' || selectedVenta.estado === 'Pagada'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}>
                {selectedVenta.estado}
              </span>
              <div className="mt-2 text-sm text-gray-600">
                <p>Tipo: <span className="font-bold">{selectedVenta.tipoComprobante || 'Recibo'}</span></p>
                <p>Nº: <span className="font-mono font-medium">{selectedVenta.numFactura}</span></p>
                <p>Entrega: {selectedVenta.metodoEntrega}</p>
              </div>
            </div>
          </div>

          {/* Tabla de Productos */}
          <div>
            <h4 className="font-bold text-gray-800 mb-3 text-lg border-b pb-2">Productos Vendidos</h4>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left">Código</th>
                    <th className="px-4 py-2 text-left">Producto</th>
                    <th className="px-4 py-2 text-center">Color</th>
                    <th className="px-4 py-2 text-center">Cant.</th>
                    <th className="px-4 py-2 text-right">Precio Unit.</th>
                    <th className="px-4 py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedVenta.productos.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-gray-500">{item.producto?.codigo || item.producto?.idProductoTienda || 'N/A'}</td>
                      <td className="px-4 py-2 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          {item.producto?.imagen && (
                            <img src={`http://localhost:5000${item.producto.imagen}`} alt="" className="w-8 h-8 rounded object-cover border" />
                          )}
                          <span>{item.producto?.nombre || item.productoNombre || 'Producto Eliminado'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">{item.producto?.color || '-'}</td>
                      <td className="px-4 py-2 text-center font-semibold">{item.cantidad}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex flex-col">
                          <span className="text-gray-900">Bs. {(item.producto?.precioVenta || item.producto?.precio || 0).toFixed(2)}</span>
                          {item.producto?.precioVenta !== item.precioUnitario && (
                            <span className="text-xs text-gray-500 line-through">Oficial</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-green-600">
                        <div className="flex flex-col">
                          <span>Bs. {(item.cantidad * item.precioUnitario).toFixed(2)}</span>
                          {item.producto?.precioVenta !== item.precioUnitario && (
                            <span className="text-xs text-blue-600">
                              (A: Bs. {item.precioUnitario.toFixed(2)})
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td colSpan="5" className="px-4 py-2 text-right text-gray-700">Subtotal:</td>
                    <td className="px-4 py-2 text-right text-gray-900">Bs. {(selectedVenta.productos.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0)).toFixed(2)}</td>
                  </tr>
                  {selectedVenta.descuento > 0 && (
                    <tr className="text-red-600">
                      <td colSpan="5" className="px-4 py-1 text-right">Descuento Global:</td>
                      <td className="px-4 py-1 text-right">- Bs. {selectedVenta.descuento.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="bg-green-50">
                    <td colSpan="5" className="px-4 py-3 text-right text-gray-900 font-bold text-lg">Total Final:</td>
                    <td className="px-4 py-3 text-right text-lg text-green-700 font-bold">
                      Bs. {Math.max(0, (selectedVenta.productos.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0) - (selectedVenta.descuento || 0))).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Pagos y Observaciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-gray-800 mb-2 border-b pb-1">Observaciones</h4>
              <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg border min-h-[80px]">
                {selectedVenta.observaciones || "Sin observaciones adicionales."}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-2 border-b pb-1">Desglose de Pagos</h4>
              <div className="space-y-2">
                {selectedVenta.metodosPago && selectedVenta.metodosPago.length > 0 ? (
                  selectedVenta.metodosPago.map((pago, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{pago.tipo}:</span>
                      <span className="font-medium">Bs. {pago.monto.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No hay pagos registrados (Posiblemente crédito total)</p>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-gray-900 mt-2">
                  <span>Total Pagado:</span>
                  <span>Bs. {(selectedVenta.metodosPago?.reduce((acc, curr) => acc + curr.monto, 0) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Saldo Pendiente:</span>
                  <span>Bs. {(selectedVenta.saldoPendiente || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end rounded-b-xl">
          <button
            onClick={() => setShowDetailModal(false)}
            className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 shadow transition-colors"
          >
            Cerrar
          </button>
          {/* Opcional: Agregar botón Imprimir aquí */}
        </div>
      </div>
    </div>
  )
}

          </>
        )}

{/* --- VISTA DE GESTIÓN DE CLIENTES --- */ }
{
  activeTab === 'clientes' && (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Cartera de Clientes</h2>
        <button
          onClick={() => {
            setClienteEditing(null); // Modo crear
            setNuevoCliente({
              nombre: '', empresa: '', direccion: '', telefono: '', email: '', nit: '', ci: '', ubicacion: ''
            });
            setShowCreateClientForm(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          <span>+</span> Nuevo Cliente
        </button>
      </div>

      {/* Formulario Modal para Crear/Editar Cliente */}
      {showCreateClientForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">
                {clienteEditing ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
              </h3>
              <button
                onClick={() => setShowCreateClientForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    value={nuevoCliente.nombre}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                    className={`w-full p-2 border ${clienteErrors.nombre ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                  />
                  {clienteErrors.nombre && <p className="text-red-500 text-xs mt-1">{clienteErrors.nombre}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                  <input
                    type="text"
                    value={nuevoCliente.empresa}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, empresa: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
                  <input
                    type="text"
                    value={nuevoCliente.telefono}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                    className={`w-full p-2 border ${clienteErrors.telefono ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                  />
                  {clienteErrors.telefono && <p className="text-red-500 text-xs mt-1">{clienteErrors.telefono}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                  <input
                    type="text"
                    value={nuevoCliente.direccion}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
                    className={`w-full p-2 border ${clienteErrors.direccion ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                  />
                  {clienteErrors.direccion && <p className="text-red-500 text-xs mt-1">{clienteErrors.direccion}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={nuevoCliente.email}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                    className={`w-full p-2 border ${clienteErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
                  <input
                    type="text"
                    value={nuevoCliente.nit}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, nit: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CI</label>
                  <input
                    type="text"
                    value={nuevoCliente.ci}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, ci: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                  <input
                    type="text"
                    value={nuevoCliente.ubicacion}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, ubicacion: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Coordenadas o Ref."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 rounded-b-xl">
              <button
                onClick={() => setShowCreateClientForm(false)}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCliente}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-md transition-colors"
              >
                {clienteEditing ? 'Actualizar Cliente' : 'Guardar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Clientes */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3">Cliente / Empresa</th>
              <th className="px-6 py-3">Contacto</th>
              <th className="px-6 py-3">Ubicación</th>
              <th className="px-6 py-3">NIT / CI</th>
              <th className="px-6 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clientes.map(cliente => (
              <tr key={cliente._id} className="bg-white hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{cliente.nombre}</div>
                  {cliente.empresa && <div className="text-indigo-600 text-xs">{cliente.empresa}</div>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span>📞</span> {cliente.telefono}
                  </div>
                  {cliente.email && (
                    <div className="flex items-center gap-2 text-xs">
                      <span>✉️</span> {cliente.email}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 max-w-xs truncate">
                  {cliente.direccion}
                  {cliente.ubicacion && <div className="text-xs text-blue-500">📍 {cliente.ubicacion}</div>}
                </td>
                <td className="px-6 py-4">
                  {cliente.nit ? `NIT: ${cliente.nit}` : ''}
                  {cliente.ci ? `CI: ${cliente.ci}` : ''}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleEditCliente(cliente)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteCliente(cliente._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                  No hay clientes registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

      </main >
    </div >
  );
};

export default VentasPage;