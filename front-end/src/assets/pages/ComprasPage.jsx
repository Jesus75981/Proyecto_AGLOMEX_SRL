  
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
  } else {
    throw new Error('Token no válido');
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Token no válido');
    }
    const errorData = await response.json();
    throw new Error(errorData.message || errorData.error || 'Error en la petición a la API');
  }

  return response.json();
};


const ComprasPage = ({ userRole }) => {
  const navigate = useNavigate();

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const volverAlHome = () => navigate('/home');

  // --- Estados ---
  const [activeSection, setActiveSection] = useState('realizarCompra');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data from API
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  // Search & Filtering
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [mostrarResultadosProveedor, setMostrarResultadosProveedor] = useState(false);
  const [mostrarResultadosProducto, setMostrarResultadosProducto] = useState(false);

  // Generate automatic purchase number
  const generarNumeroCompra = () => {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
    return `COMP-${year}${month}${day}-${timestamp}`;
  };

  // Main Purchase Form
  const [compra, setCompra] = useState({
    fecha: new Date().toISOString().split('T')[0],
    numeroCompra: generarNumeroCompra(), // Automatic generation
    tipoCompra: 'Materia Prima', // Default value, can be changed
    proveedorId: '',
    proveedorNombre: '',
    observaciones: '',
    numeroFactura: '',
    metodoPago: [],
    productos: [],
    anticipos: []
  });

  // Temporary states for forms
  const [productoTemporal, setProductoTemporal] = useState({
    productoId: '',
    productoNombre: '',
    cantidad: 1,
    costoUnitario: 0
  });

  // Form visibility
  const [showProveedorForm, setShowProveedorForm] = useState(false);
  const [showProductoForm, setShowProductoForm] = useState(false);

  // Payment - now checkboxes with amounts
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState([]);
  const [pagos, setPagos] = useState({ Efectivo: 0, Transferencia: 0, Cheque: 0, Credito: 0 });
  const [chequeImage, setChequeImage] = useState(null);

  // New item forms
  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombre: '',
    contacto: { telefono: '', email: '' },
    direccion: '',
    nit: ''
  });
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    categoria: '',
    color: '',
    marca: '',
    ubicacion: '',
    proveedor: '',
    dimensiones: {
      alto: '',
      ancho: '',
      profundidad: ''
    }
  });

  // --- Data Loading ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [proveedoresData, productosData] = await Promise.all([
          apiFetch('/proveedores'),
          apiFetch('/productos')
        ]);
        setProveedores(proveedoresData);
        setProductos(productosData);

        // Extract unique categories from products
        const uniqueCategorias = [...new Set(productosData.map(p => p.categoria))];
        setCategorias(uniqueCategorias);

      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.message.includes('Token no válido') || error.message.includes('403') || error.message.includes('Forbidden')) {
          alert('Sesión expirada. Redirigiendo al login.');
          navigate('/login');
        } else {
          alert('No se pudo cargar la información inicial. Verifique la conexión con el servidor.');
        }
      }
    };
    fetchData();
  }, [navigate]);

  // --- Search Effects ---
  useEffect(() => {
    if (busquedaProveedor) {
      const filtrados = proveedores.filter(p =>
        p.nombre.toLowerCase().includes(busquedaProveedor.toLowerCase()) ||
        (p.nit && p.nit.toLowerCase().includes(busquedaProveedor.toLowerCase()))
      );
      setProveedoresFiltrados(filtrados);
      setMostrarResultadosProveedor(true);
    } else {
      setProveedoresFiltrados([]);
      setMostrarResultadosProveedor(false);
    }
  }, [busquedaProveedor, proveedores]);

  useEffect(() => {
    if (busquedaProducto) {
      const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        p.codigo.toLowerCase().includes(busquedaProducto.toLowerCase())
      );
      setProductosFiltrados(filtrados);
      setMostrarResultadosProducto(true);
    } else {
      setProductosFiltrados([]);
      setMostrarResultadosProducto(false);
    }
  }, [busquedaProducto, productos]);

  // --- Calculations ---
  const totalCompra = compra.productos.reduce((total, item) => total + item.costoTotal, 0);
  const totalPagado = Object.values(pagos).reduce((total, valor) => total + valor, 0);

  // --- Handlers ---

  const handleCrearProveedor = async () => {
    if (!nuevoProveedor.nombre || !nuevoProveedor.nit) {
        alert('Nombre y NIT del proveedor son requeridos.');
        return;
    }
    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (nuevoProveedor.contacto.email && !emailRegex.test(nuevoProveedor.contacto.email)) {
        alert('Por favor ingrese un email válido.');
        return;
    }
    // Validación de teléfono (ejemplo: solo números, mínimo 7 dígitos)
    const phoneRegex = /^\d{7,15}$/;
    if (nuevoProveedor.contacto.telefono && !phoneRegex.test(nuevoProveedor.contacto.telefono)) {
        alert('Por favor ingrese un número de teléfono válido (solo números, 7-15 dígitos).');
        return;
    }
    try {
        const proveedorCreado = await apiFetch('/proveedores', {
            method: 'POST',
            body: JSON.stringify(nuevoProveedor)
        });
        setProveedores([...proveedores, proveedorCreado]);
        setShowProveedorForm(false);
        setNuevoProveedor({ nombre: '', contacto: { telefono: '', email: '' }, direccion: '', nit: '' });
        seleccionarProveedor(proveedorCreado); // Auto-select the new provider
        alert('Proveedor creado y seleccionado exitosamente.');
    } catch (error) {
        console.error("Error creando proveedor:", error);
        alert(`Error creando proveedor: ${error.message}`);
    }
  };
  
  const seleccionarProveedor = (proveedor) => {
    setCompra({
      ...compra,
      proveedorId: proveedor._id,
      proveedorNombreX: proveedor.nombre
    });
    setBusquedaProveedor(proveedor.nombre);
    setMostrarResultadosProveedor(false);
  };

  const handleCrearProducto = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.categoria || !nuevoProducto.color) {
        alert('Nombre, Categoría y Color son requeridos para el nuevo producto.');
        return;
    }
    if (nuevoProducto.categoria === 'Mesas') {
        alert('La categoría "Mesas" no es válida. Selecciona "Mesa" en su lugar.');
        return;
    }
    try {
        // Filtrar campos vacíos para evitar errores de ObjectId
        const productoData = { ...nuevoProducto };
        if (!productoData.proveedor || productoData.proveedor === '') {
            delete productoData.proveedor;
        }
        if (!productoData.marca || productoData.marca === '') {
            delete productoData.marca;
        }

        const productoCreado = await apiFetch('/productos', {
            method: 'POST',
            body: JSON.stringify(productoData)
        });
        setProductos([...productos, productoCreado]);
        setShowProductoForm(false);
        setNuevoProducto({ nombre: '', categoria: '', color: '', marca: '', ubicacion: '', proveedor: '', dimensiones: { alto: '', ancho: '', profundidad: '' } });
        alert('Producto creado exitosamente.');
    } catch (error) {
        console.error("Error creando producto:", error);
        alert(`Error creando producto: ${error.message}`);
    }
  };

  const seleccionarProducto = (producto) => {
    setProductoTemporal({
      productoId: producto._id,
      productoNombre: producto.nombre,
      cantidad: 1,
      costoUnitario: producto.precioCompra || 0 // Use precioCompra from DB
    });
    setBusquedaProducto(producto.nombre);
    setMostrarResultadosProducto(false);
  };

  const agregarProductoACompra = () => {
    if (!productoTemporal.productoId || productoTemporal.cantidad <= 0 || productoTemporal.costoUnitario <= 0) {
        alert('Seleccione un producto y asegúrese que la cantidad y el costo son mayores a 0.');
        return;
    }

    const productoSeleccionado = productos.find(p => p._id === productoTemporal.productoId);
    if (!productoSeleccionado) return;

    const productoCompra = {
      _id: productoSeleccionado._id,
      nombre: productoSeleccionado.nombre,
      codigo: productoSeleccionado.codigo,
      color: productoSeleccionado.color,
      cantidad: productoTemporal.cantidad,
      costoUnitario: productoTemporal.costoUnitario,
      costoTotal: productoTemporal.cantidad * productoTemporal.costoUnitario
    };

    setCompra({
      ...compra,
      productos: [...compra.productos, productoCompra]
    });

    // Reset temporary product form
    setProductoTemporal({ productoId: '', productoNombre: '', cantidad: 1, costoUnitario: 0 });
    setBusquedaProducto('');
  };

  const toggleMetodoPago = (metodo) => {
    const nuevosMetodos = compra.metodoPago.includes(metodo)
      ? compra.metodoPago.filter(m => m !== metodo)
      : [...compra.metodoPago, metodo];
    setCompra({ ...compra, metodoPago: nuevosMetodos });
  };

  const confirmarCompra = async () => {
      if (!compra.proveedorId || compra.productos.length === 0) {
          alert('Debe seleccionar un proveedor y agregar al menos un producto.');
          return;
      }

      // Validación para pago con cheque: verificar imagen y monto
      if (pagos.Cheque > 0) {
          if (!chequeImage) {
              alert('Debe subir una imagen del cheque para pagos con cheque.');
              return;
          }
          // Aquí podrías agregar lógica para verificar el monto en la imagen, pero por ahora solo validamos que esté presente
          // En un futuro, integrar OCR para leer el monto del cheque
      }

      const compraData = {
          numCompra: compra.numeroCompra,
          fecha: compra.fecha,
          tipoCompra: compra.tipoCompra,
          proveedor: compra.proveedorId,
          productos: compra.productos.map(p => ({
              producto: p._id,
              cantidad: p.cantidad,
              precioUnitario: p.costoUnitario,
              nombreProducto: p.nombre,
              colorProducto: p.color,
              categoriaProducto: p.categoria,
              dimensiones: { alto: 0, ancho: 0, profundidad: 0 }, // Default dimensions
              imagenProducto: '' // Default empty image
          })),
          metodosPago: Object.entries(pagos).filter(([key, value]) => value > 0).map(([tipo, monto]) => ({
              tipo,
              monto,
              referencia: tipo === 'Cheque' ? 'REF-CHQ-' + Date.now() : '',
              cuenta: ''
          })),
          totalCompra: totalCompra,
          estado: 'Pagada',
          observaciones: compra.observaciones,
          chequeImage: chequeImage ? chequeImage.name : null // Solo el nombre por ahora, en producción subir a servidor
      };

      try {
          const compraCreada = await apiFetch('/compras', {
              method: 'POST',
              body: JSON.stringify(compraData)
          });
          alert(`Compra registrada exitosamente. Total: Bs. ${totalCompra.toFixed(2)}. Redirigiendo al módulo de inventario para verificar.`);
          // Reset form
          setCompra({
              fecha: new Date().toISOString().split('T')[0],
              numeroCompra: generarNumeroCompra(), // Generate new automatic number
              tipoCompra: 'Materia Prima', // Reset to default
              proveedorId: '',
              proveedorNombre: '',
              observaciones: '',
              numeroFactura: '',
              metodoPago: [],
              productos: [],
              anticipos: []
          });
          setPagos({ Efectivo: 0, Transferencia: 0, Cheque: 0, Credito: 0 });
          setChequeImage(null);
          // Redirect to inventory module
          navigate('/inventario');
      } catch (error) {
          console.error("Error al confirmar la compra:", error);
          alert(`Error al registrar la compra: ${error.message}`);
      }
  };

  const handlePagoChange = (metodo, valor) => {
    setPagos(prevPagos => ({
      ...prevPagos,
      [metodo]: valor
    }));
  };

  const metodosPago = ['Efectivo', 'Transferencia', 'Cheque', 'Crédito'];

  const metodosPagoOptions = ['Efectivo', 'Transferencia', 'Cheque', 'Credito'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <button onClick={volverAlHome} className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition">
              <span>←</span> <span>Volver al Home</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Módulo de Compras</h1>
          </div>
        </div>
      </nav>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-purple-600 mb-2">Realizar Compra</h1>
            <p className="text-gray-600 text-lg">Gestión de compras, proveedores y productos</p>
          </div>

          {/* Purchase Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-4">Información General de la Compra</h2>
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                  <input type="date" value={compra.fecha} onChange={(e) => setCompra({...compra, fecha: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número de Compra (Automático)</label>
                  <input type="text" value={compra.numeroCompra} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Compra</label>
                  <select value={compra.tipoCompra} onChange={(e) => setCompra({...compra, tipoCompra: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="Materia Prima">Materia Prima</option>
                    <option value="Producto Terminado">Producto Terminado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número de Factura</label>
                  <input type="text" placeholder="Ingrese número de factura" value={compra.numeroFactura} onChange={(e) => setCompra({...compra, numeroFactura: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>

              {/* Supplier */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor</label>
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <input type="text" placeholder="Buscar proveedor por nombre o NIT..." value={busquedaProveedor} onChange={(e) => setBusquedaProveedor(e.target.value)} onFocus={() => busquedaProveedor && setMostrarResultadosProveedor(true)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    {mostrarResultadosProveedor && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {proveedoresFiltrados.length > 0 ? proveedoresFiltrados.map(p => (
                          <div key={p._id} onClick={() => seleccionarProveedor(p)} className="px-4 py-2 hover:bg-purple-50 cursor-pointer">
                            <div className="font-medium text-gray-800">{p.nombre}</div>
                            <div className="text-sm text-gray-600">NIT: {p.nit}</div>
                          </div>
                        )) : <div className="px-4 py-3 text-gray-500 text-center">No se encontraron proveedores</div>}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setShowProveedorForm(!showProveedorForm)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition whitespace-nowrap">
                    {showProveedorForm ? 'Cancelar' : '+ Crear Proveedor'}
                  </button>
                </div>
                {compra.proveedorNombre && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <span className="text-sm text-green-800">✅ Proveedor seleccionado: <strong>{compra.proveedorNombre}</strong></span>
                  </div>
                )}
              </div>

              {/* New Supplier Form */}
              {showProveedorForm && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Nuevo Proveedor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Nombre del proveedor" value={nuevoProveedor.nombre} onChange={(e) => setNuevoProveedor({...nuevoProveedor, nombre: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                    <input type="text" placeholder="NIT" value={nuevoProveedor.nit} onChange={(e) => setNuevoProveedor({...nuevoProveedor, nit: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                    <input type="text" placeholder="Teléfono" value={nuevoProveedor.contacto.telefono} onChange={(e) => setNuevoProveedor({...nuevoProveedor, contacto: {...nuevoProveedor.contacto, telefono: e.target.value}})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                    <input type="email" placeholder="Email" value={nuevoProveedor.contacto.email} onChange={(e) => setNuevoProveedor({...nuevoProveedor, contacto: {...nuevoProveedor.contacto, email: e.target.value}})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                    <div className="md:col-span-2">
                      <input type="text" placeholder="Dirección" value={nuevoProveedor.direccion} onChange={(e) => setNuevoProveedor({...nuevoProveedor, direccion: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div className="md:col-span-2 flex space-x-4">
                      <button onClick={handleCrearProveedor} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Guardar</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Observations */}
              <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                  <textarea value={compra.observaciones} onChange={(e) => setCompra({...compra, observaciones: e.target.value})} placeholder="Ej: El proveedor enviará la mercadería una vez se cancele el saldo." rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              {/* --- Products Section --- */}
              <div className="border-t pt-6">
                 <h2 className="text-2xl font-semibold text-gray-800 mb-6">Productos de la Compra</h2>
                
                {/* Search and Add Product */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">Buscar y Agregar Producto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                    <div className="md:col-span-2 relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Producto</label>
                      <input type="text" placeholder="Buscar por nombre o código..." value={busquedaProducto} onChange={(e) => setBusquedaProducto(e.target.value)} onFocus={() => busquedaProducto && setMostrarResultadosProducto(true)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                       {mostrarResultadosProducto && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {productosFiltrados.length > 0 ? productosFiltrados.map(p => (
                            <div key={p._id} onClick={() => seleccionarProducto(p)} className="px-4 py-2 hover:bg-blue-50 cursor-pointer">
                              <div className="font-medium text-gray-800">{p.nombre} ({p.codigo})</div>
                              <div className="text-sm text-gray-600">Color: {p.color} - Cat: {p.categoria}</div>
                            </div>
                          )) : <div className="px-4 py-3 text-gray-500 text-center">No se encontraron productos</div>}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                      <input type="number" placeholder="Cantidad" value={productoTemporal.cantidad} onChange={(e) => setProductoTemporal({...productoTemporal, cantidad: parseInt(e.target.value) || 0})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario</label>
                      <input type="number" step="0.01" placeholder="Costo" value={productoTemporal.costoUnitario} onChange={(e) => setProductoTemporal({...productoTemporal, costoUnitario: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                   {productoTemporal.productoNombre && (
                    <div className="mb-4 p-2 bg-blue-100 border border-blue-200 rounded">
                      <span className="text-sm text-blue-800">✅ Producto: <strong>{productoTemporal.productoNombre}</strong></span>
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <button onClick={agregarProductoACompra} disabled={!productoTemporal.productoId} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                      Agregar Producto a la Compra
                    </button>
                    <button onClick={() => setShowProductoForm(!showProductoForm)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
                      {showProductoForm ? 'Cancelar' : '+ Crear Nuevo Producto'}
                    </button>
                  </div>
                </div>

                {/* New Product Form */}
                {showProductoForm && (
                  <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <h3 className="text-lg font-semibold text-teal-800 mb-4">Crear Nuevo Producto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Nombre del producto" value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg" />

                      <select value={nuevoProducto.categoria} onChange={(e) => setNuevoProducto({...nuevoProducto, categoria: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">-- Seleccionar Categoría --</option>
                        <option value="Silla">Silla</option>
                        <option value="Mesa">Mesa</option>
                        <option value="Sofá">Sofá</option>
                        <option value="Estantería">Estantería</option>
                        <option value="Armario">Armario</option>
                        <option value="Otro">Otro</option>
                      </select>
                      {nuevoProducto.categoria === 'Mesas' && <p className="text-red-500 text-sm">Nota: La categoría 'Mesas' no es válida. Selecciona 'Mesa' en su lugar.</p>}

                      <input type="text" placeholder="Color" value={nuevoProducto.color} onChange={(e) => setNuevoProducto({...nuevoProducto, color: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                      <input type="text" placeholder="Marca" value={nuevoProducto.marca} onChange={(e) => setNuevoProducto({...nuevoProducto, marca: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg" />

                      <input type="number" step="0.01" placeholder="Alto (cm)" value={nuevoProducto.dimensiones.alto} onChange={(e) => setNuevoProducto({...nuevoProducto, dimensiones: {...nuevoProducto.dimensiones, alto: e.target.value}})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                      <input type="number" step="0.01" placeholder="Ancho (cm)" value={nuevoProducto.dimensiones.ancho} onChange={(e) => setNuevoProducto({...nuevoProducto, dimensiones: {...nuevoProducto.dimensiones, ancho: e.target.value}})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                      <input type="number" step="0.01" placeholder="Profundidad (cm)" value={nuevoProducto.dimensiones.profundidad} onChange={(e) => setNuevoProducto({...nuevoProducto, dimensiones: {...nuevoProducto.dimensiones, profundidad: e.target.value}})} className="px-4 py-2 border border-gray-300 rounded-lg" />

                      <input type="text" placeholder="Ubicación" value={nuevoProducto.ubicacion} onChange={(e) => setNuevoProducto({...nuevoProducto, ubicacion: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                      <select value={nuevoProducto.proveedor} onChange={(e) => setNuevoProducto({...nuevoProducto, proveedor: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg">
                          <option value="">-- Seleccionar Proveedor --</option>
                          {proveedores.map(p => <option key={p._id} value={p._id}>{p.nombre}</option>)}
                      </select>
                      <div className="md:col-span-2 flex space-x-4">
                        <button onClick={handleCrearProducto} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700">Guardar Producto</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Products in Purchase Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="text-left py-3 px-4">Producto</th>
                                <th className="text-left py-3 px-4">Código</th>
                                <th className="text-right py-3 px-4">Cantidad</th>
                                <th className="text-right py-3 px-4">Costo Unit.</th>
                                <th className="text-right py-3 px-4">Costo Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {compra.productos.map((p, index) => (
                                <tr key={index} className="border-b">
                                    <td className="py-3 px-4">{p.nombre}</td>
                                    <td className="py-3 px-4">{p.codigo}</td>
                                    <td className="text-right py-3 px-4">{p.cantidad}</td>
                                    <td className="text-right py-3 px-4">Bs. {p.costoUnitario.toFixed(2)}</td>
                                    <td className="text-right py-3 px-4">Bs. {p.costoTotal.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              </div>

              {/* --- Payment Section --- */}
              <div className="border-t pt-6 mt-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Pago</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-4">
                    {metodosPagoOptions.map(metodo => (
                        <div key={metodo}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{metodo}</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={pagos[metodo]}
                                onChange={(e) => handlePagoChange(metodo, parseFloat(e.target.value) || 0)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            {metodo === 'Cheque' && pagos.Cheque > 0 && (
                                <div className="mt-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Cheque</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setChequeImage(e.target.files[0])}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                    {chequeImage && <p className="text-sm text-green-600 mt-1">Imagen seleccionada: {chequeImage.name}</p>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div className="text-right mt-6">
                    <div className="text-gray-600">Total Pagado: <span className="font-bold text-blue-600">Bs. {totalPagado.toFixed(2)}</span></div>
                    <div className="text-2xl font-bold text-gray-800">Total de la Compra: Bs. {totalCompra.toFixed(2)}</div>
                    <div className="text-red-600 font-semibold">Saldo Pendiente: Bs. {Math.max(0, totalCompra - totalPagado).toFixed(2)}</div>
                </div>
              </div>

              {/* --- Finalize --- */}
              <div className="border-t pt-6 mt-6 flex justify-end">
                <button onClick={confirmarCompra} className="bg-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-purple-700 transition shadow-lg">
                  Confirmar y Registrar Compra
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprasPage;
