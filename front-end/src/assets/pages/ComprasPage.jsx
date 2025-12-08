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
  const [materiasPrimas, setMateriasPrimas] = useState([]);
  const [categorias, setCategorias] = useState([]);


  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [compraEditando, setCompraEditando] = useState(null);

  // Search & Filtering
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [materiasPrimasFiltradas, setMateriasPrimasFiltradas] = useState([]);
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
  const [pagos, setPagos] = useState({ Efectivo: 0, Transferencia: 0, Cheque: 0, Credito: 0 });
  const [chequeImage, setChequeImage] = useState(null);

  // New item forms
  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombre: '',
    nombreComercial: '',
    contacto: { telefono: '', email: '' },
    direccion: '',
    ubicacion: '',
    nit: '',
    bancos: [{ nombre: '', numeroCuenta: '' }]
  });

  // New product form state
  const [nuevoProducto, setNuevoProducto] = useState({
    tipo: 'Materia Prima',
    nombre: '',
    codigo: '',
    categoria: '',
    nuevaCategoria: '',
    color: '',
    marca: '',
    dimensiones: { alto: '', ancho: '', profundidad: '' },
    precioCompra: '',
    precioCompra: '',
    precioVenta: '',
    imagen: '' // URL de la imagen subida
  });
  
  const [imagenFile, setImagenFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Payment methods options
  const metodosPagoOptions = ['Efectivo', 'Transferencia', 'Cheque', 'Credito'];

  // Funciones para manejar bancos
  const agregarBanco = () => {
    setNuevoProveedor(prev => ({
      ...prev,
      bancos: [...prev.bancos, { nombre: '', numeroCuenta: '' }]
    }));
  };

  const actualizarBanco = (index, campo, valor) => {
    setNuevoProveedor(prev => ({
      ...prev,
      bancos: prev.bancos.map((banco, i) =>
        i === index ? { ...banco, [campo]: valor } : banco
      )
    }));
  };

  const eliminarBanco = (index) => {
    setNuevoProveedor(prev => ({
      ...prev,
      bancos: prev.bancos.filter((_, i) => i !== index)
    }));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [proveedoresData, productosData, materiasPrimasData] = await Promise.all([
          apiFetch('/proveedores'),
          apiFetch('/productos'),
          apiFetch('/materiaPrima')
        ]);
        setProveedores(proveedoresData);
        setProductos(productosData);
        setMateriasPrimas(materiasPrimasData);

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
    if (busquedaProducto && busquedaProducto.trim() !== '') {
      if (compra.tipoCompra === 'Materia Prima') {
        const filtrados = materiasPrimas.filter(mp =>
          (mp.nombre && mp.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())) ||
          (mp.codigo && mp.codigo.toLowerCase().includes(busquedaProducto.toLowerCase()))
        );
        setMateriasPrimasFiltradas(filtrados);
        setMostrarResultadosProducto(true);
      } else {
        const filtrados = productos.filter(p =>
          (p.nombre && p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())) ||
          (p.codigo && p.codigo.toLowerCase().includes(busquedaProducto.toLowerCase()))
        );
        setProductosFiltrados(filtrados);
        setMostrarResultadosProducto(true);
      }
    } else {
      setProductosFiltrados([]);
      setMateriasPrimasFiltradas([]);
      setMostrarResultadosProducto(false);
    }
  }, [busquedaProducto, productos, materiasPrimas, compra.tipoCompra]);

  // --- Calculations ---
  const totalCompra = compra.productos.reduce((total, item) => total + item.costoTotal, 0);
  const totalPagado = Object.values(pagos).reduce((total, valor) => total + valor, 0);

  // --- Handlers ---

  const handleCrearProveedor = async () => {
    if (!nuevoProveedor.nombre || !nuevoProveedor.nit) {
      alert('Por favor complete los campos obligatorios: Nombre y NIT');
      return;
    }

    try {
      const nuevoProv = await apiFetch('/proveedores', {
        method: 'POST',
        body: JSON.stringify(nuevoProveedor)
      });

      setProveedores(prev => [...prev, nuevoProv]);
      setNuevoProveedor({
        nombre: '',
        nombreComercial: '',
        contacto: { telefono: '', email: '' },
        direccion: '',
        ubicacion: '',
        nit: '',
        bancos: [{ nombre: '', numeroCuenta: '' }]
      });
      setShowProveedorForm(false);
      alert('Proveedor creado exitosamente');
    } catch (error) {
      console.error('Error creando proveedor:', error);
      alert('Error al crear el proveedor: ' + error.message);
    }
  };

  const seleccionarProveedor = (proveedor) => {
    setCompra(prev => ({
      ...prev,
      proveedorId: proveedor._id,
      proveedorNombre: proveedor.nombre
    }));
    setBusquedaProveedor(proveedor.nombre);
    setMostrarResultadosProveedor(false);
  };

  const seleccionarProducto = (producto) => {
    setProductoTemporal({
      productoId: producto._id,
      productoNombre: producto.nombre,
      cantidad: 1,
      costoUnitario: 0
    });
    setBusquedaProducto(producto.nombre);
    setMostrarResultadosProducto(false);
  };

  const agregarProductoACompra = () => {
    if (!productoTemporal.productoId || productoTemporal.cantidad <= 0 || productoTemporal.costoUnitario <= 0) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }

    const costoTotal = productoTemporal.cantidad * productoTemporal.costoUnitario;
    const nuevoProductoCompra = {
      ...productoTemporal,
      costoTotal
    };

    setCompra(prev => ({
      ...prev,
      productos: [...prev.productos, nuevoProductoCompra]
    }));

    // Reset temporal product
    setProductoTemporal({
      productoId: '',
      productoNombre: '',
      cantidad: 1,
      costoUnitario: 0
    });
    setBusquedaProducto('');
  };

  const handleCategoriaChange = (e) => {
    const value = e.target.value;
    setNuevoProducto(prev => ({
      ...prev,
      categoria: value,
      nuevaCategoria: value === 'nueva' ? '' : prev.nuevaCategoria
    }));
  };

  const handlePagoChange = (metodo, valor) => {
    setPagos(prev => ({
      ...prev,
      [metodo]: valor
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImagenFile(file);
    setUploadingImage(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
        // Usar fetch directamente para FormData ya que apiFetch está configurado para JSON
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) throw new Error('Error al subir imagen');

        const data = await response.json();
        setNuevoProducto(prev => ({ ...prev, imagen: data.imageUrl }));
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error al subir la imagen');
        setImagenFile(null);
    } finally {
        setUploadingImage(false);
    }
  };

  const handleCrearProducto = async () => {
    if (!nuevoProducto.nombre) {
      alert('El nombre es obligatorio');
      return;
    }

    if (nuevoProducto.tipo === 'Producto Terminado' && (!nuevoProducto.categoria || (nuevoProducto.categoria === 'nueva' && !nuevoProducto.nuevaCategoria) || !nuevoProducto.color)) {
      alert('Complete todos los campos obligatorios para el producto terminado');
      return;
    }

    try {
      let endpoint, payload;

      if (nuevoProducto.tipo === 'Materia Prima') {
        endpoint = '/materiaPrima';
        payload = {
          nombre: nuevoProducto.nombre,
          precioCompra: parseFloat(nuevoProducto.precioCompra) || 0,
          precioVenta: parseFloat(nuevoProducto.precioVenta) || 0
        };
      } else {
        endpoint = '/productos';
        payload = {
          nombre: nuevoProducto.nombre,
          codigo: nuevoProducto.codigo,
          categoria: nuevoProducto.categoria === 'nueva' ? nuevoProducto.nuevaCategoria : nuevoProducto.categoria,
          color: nuevoProducto.color,
          marca: nuevoProducto.marca,
          dimensiones: {
            alto: parseFloat(nuevoProducto.dimensiones.alto) || 0,
            ancho: parseFloat(nuevoProducto.dimensiones.ancho) || 0,
            profundidad: parseFloat(nuevoProducto.dimensiones.profundidad) || 0
          },
          imagen: nuevoProducto.imagen // Enviar URL de la imagen
        };

        // Add new category if created
        if (nuevoProducto.categoria === 'nueva' && nuevoProducto.nuevaCategoria) {
          setCategorias(prev => [...prev, nuevoProducto.nuevaCategoria]);
        }
      }

      const nuevoItem = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Update the appropriate list
      if (nuevoProducto.tipo === 'Materia Prima') {
        setMateriasPrimas(prev => [...prev, nuevoItem]);
      } else {
        setProductos(prev => [...prev, nuevoItem]);
      }

      // Reset form
      setNuevoProducto({
        tipo: 'Materia Prima',
        nombre: '',
        codigo: '',
        categoria: '',
        nuevaCategoria: '',
        color: '',
        marca: '',
        dimensiones: { alto: '', ancho: '', profundidad: '' },
        precioCompra: '',
        precioCompra: '',
        precioVenta: '',
        imagen: ''
      });
      setImagenFile(null);
      setShowProductoForm(false);
      alert(`${nuevoProducto.tipo} creado exitosamente. ${nuevoProducto.imagen ? 'La generación del modelo 3D ha iniciado.' : ''}`);
    } catch (error) {
      console.error('Error creando producto:', error);
      alert('Error al crear el item: ' + error.message);
    }
  };

  const confirmarCompra = async () => {
    if (compra.productos.length === 0) {
      alert('Debe agregar al menos un producto a la compra');
      return;
    }

    if (!compra.proveedorId) {
      alert('Debe seleccionar un proveedor');
      return;
    }

    if (totalPagado > totalCompra) {
      alert('El total pagado no puede ser mayor al total de la compra');
      return;
    }

    try {
      // Map products to backend expected format
      const productosMapped = compra.productos.map(p => ({
        producto: p.productoId,
        nombreProducto: p.productoNombre,
        cantidad: p.cantidad,
        precioUnitario: p.costoUnitario,
        costoTotal: p.costoTotal,
        onModel: compra.tipoCompra === 'Materia Prima' ? 'MateriaPrima' : 'ProductoTienda'
      }));

      // Map payment methods to backend expected format
      const metodosPagoMapped = Object.entries(pagos).filter(([_, valor]) => valor > 0).map(([metodo, valor]) => ({
        tipo: metodo === 'Credito' ? 'Crédito' : metodo,
        monto: valor
      }));

      const compraData = {
        tipoCompra: compra.tipoCompra,
        proveedor: compra.proveedorId,
        productos: productosMapped,
        totalCompra,
        metodosPago: metodosPagoMapped,
        observaciones: compra.observaciones
      };

      const nuevaCompra = await apiFetch('/compras', {
        method: 'POST',
        body: JSON.stringify(compraData)
      });

      alert('Compra registrada exitosamente');

      // Reset form
      setCompra({
        fecha: new Date().toISOString().split('T')[0],
        numeroCompra: generarNumeroCompra(),
        tipoCompra: 'Materia Prima',
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
      setBusquedaProveedor('');
      setBusquedaProducto('');

    } catch (error) {
      console.error('Error confirmando compra:', error);
      alert('Error al registrar la compra: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-800">Módulo de Compras</h1>
            <button
              onClick={volverAlHome}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Volver al Home
            </button>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Compra</label>
                  <input type="text" value={compra.numeroCompra} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Compra</label>
                  <select
                    value={compra.tipoCompra}
                    onChange={(e) => setCompra({ ...compra, tipoCompra: e.target.value, productos: [] })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="Materia Prima">Materia Prima</option>
                    <option value="Producto Terminado">Producto Terminado</option>
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Buscar proveedor..."
                      value={busquedaProveedor}
                      onChange={(e) => setBusquedaProveedor(e.target.value)}
                      onFocus={() => busquedaProveedor && setMostrarResultadosProveedor(true)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => setShowProveedorForm(!showProveedorForm)}
                      className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition"
                      title="Nuevo Proveedor"
                    >
                      +
                    </button>
                  </div>
                  {mostrarResultadosProveedor && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {proveedoresFiltrados.length > 0 ? proveedoresFiltrados.map(p => (
                        <div
                          key={p._id}
                          onClick={() => seleccionarProveedor(p)}
                          className="px-4 py-2 hover:bg-purple-50 cursor-pointer transition"
                        >
                          <div className="font-medium text-gray-800">{p.nombre}</div>
                          <div className="text-sm text-gray-600">NIT: {p.nit}</div>
                        </div>
                      )) : (
                        <div className="px-4 py-3 text-gray-500 text-center">No se encontraron proveedores</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

               {/* Formulario Nuevo Proveedor */}
               {showProveedorForm && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">Registrar Nuevo Proveedor</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Nombre Razón Social *" value={nuevoProveedor.nombre} onChange={(e) => setNuevoProveedor({...nuevoProveedor, nombre: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                        <input type="text" placeholder="NIT/CI *" value={nuevoProveedor.nit} onChange={(e) => setNuevoProveedor({...nuevoProveedor, nit: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                        <input type="text" placeholder="Nombre Comercial" value={nuevoProveedor.nombreComercial} onChange={(e) => setNuevoProveedor({...nuevoProveedor, nombreComercial: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                        <input type="text" placeholder="Dirección" value={nuevoProveedor.direccion} onChange={(e) => setNuevoProveedor({...nuevoProveedor, direccion: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                        <input type="text" placeholder="Teléfono" value={nuevoProveedor.contacto.telefono} onChange={(e) => setNuevoProveedor({...nuevoProveedor, contacto: {...nuevoProveedor.contacto, telefono: e.target.value}})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                        <input type="email" placeholder="Email" value={nuevoProveedor.contacto.email} onChange={(e) => setNuevoProveedor({...nuevoProveedor, contacto: {...nuevoProveedor.contacto, email: e.target.value}})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                        <div className="md:col-span-2">
                            <button onClick={handleCrearProveedor} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold">Guardar Proveedor</button>
                        </div>
                    </div>
                </div>
               )}

              {/* Search and Add Product */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">Buscar y Agregar Producto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                    <div className="md:col-span-2 relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Buscar {compra.tipoCompra === 'Materia Prima' ? 'Materia Prima' : 'Producto'}</label>
                      <input type="text" placeholder="Buscar por nombre o código..." value={busquedaProducto} onChange={(e) => setBusquedaProducto(e.target.value)} onFocus={() => busquedaProducto && setMostrarResultadosProducto(true)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                       {mostrarResultadosProducto && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {((compra.tipoCompra === 'Materia Prima' ? materiasPrimasFiltradas : productosFiltrados).length > 0) ? (compra.tipoCompra === 'Materia Prima' ? materiasPrimasFiltradas : productosFiltrados).map(p => (
                            <div key={p._id} onClick={() => seleccionarProducto(p)} className="px-4 py-2 hover:bg-blue-50 cursor-pointer">
                              <div className="font-medium text-gray-800">{p.nombre} ({p.codigo})</div>
                              <div className="text-sm text-gray-600">{compra.tipoCompra === 'Materia Prima' ? 'Tipo: Materia Prima' : 'Color: ' + p.color + ' - Cat: ' + p.categoria}</div>
                            </div>
                          )) : <div className="px-4 py-3 text-gray-500 text-center">No se encontraron {compra.tipoCompra === 'Materia Prima' ? 'materias primas' : 'productos'}</div>}
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
                      {showProductoForm ? 'Cancelar' : '+ Crear Nuevo Item'}
                    </button>
                  </div>
                </div>

                {/* New Product Form */}
                {showProductoForm && (
                  <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <h3 className="text-lg font-semibold text-teal-800 mb-4">Registrar Nuevo Item</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {/* Selector de Tipo */}
                       <div className="md:col-span-2 mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Item</label>
                            <div className="flex space-x-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio text-purple-600"
                                        name="tipoProducto"
                                        value="Materia Prima"
                                        checked={nuevoProducto.tipo === 'Materia Prima'}
                                        onChange={(e) => setNuevoProducto({...nuevoProducto, tipo: e.target.value})}
                                    />
                                    <span className="ml-2">Materia Prima</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio text-purple-600"
                                        name="tipoProducto"
                                        value="Producto Terminado"
                                        checked={nuevoProducto.tipo === 'Producto Terminado'}
                                        onChange={(e) => setNuevoProducto({...nuevoProducto, tipo: e.target.value})}
                                    />
                                    <span className="ml-2">Producto Terminado</span>
                                </label>
                            </div>
                        </div>

                      <input type="text" placeholder="Nombre *" value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                      
                      {nuevoProducto.tipo === 'Producto Terminado' && (
                        <>
                            <input type="text" placeholder="Código" value={nuevoProducto.codigo} onChange={(e) => setNuevoProducto({...nuevoProducto, codigo: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                            <select value={nuevoProducto.categoria} onChange={handleCategoriaChange} className="px-4 py-2 border border-gray-300 rounded-lg">
                                <option value="">Seleccionar Categoría *</option>
                                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="nueva">+ Nueva Categoría</option>
                            </select>
                            {nuevoProducto.categoria === 'nueva' && (
                                <input type="text" placeholder="Nombre Nueva Categoría" value={nuevoProducto.nuevaCategoria} onChange={(e) => setNuevoProducto({...nuevoProducto, nuevaCategoria: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg bg-teal-100" />
                            )}
                            <input type="text" placeholder="Color *" value={nuevoProducto.color} onChange={(e) => setNuevoProducto({...nuevoProducto, color: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                            <input type="text" placeholder="Marca" value={nuevoProducto.marca} onChange={(e) => setNuevoProducto({...nuevoProducto, marca: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                            <div className="grid grid-cols-3 gap-2">
                                <input type="number" placeholder="Alto" value={nuevoProducto.dimensiones.alto} onChange={(e) => setNuevoProducto({...nuevoProducto, dimensiones: {...nuevoProducto.dimensiones, alto: e.target.value}})} className="px-2 py-2 border border-gray-300 rounded-lg" />
                                <input type="number" placeholder="Ancho" value={nuevoProducto.dimensiones.ancho} onChange={(e) => setNuevoProducto({...nuevoProducto, dimensiones: {...nuevoProducto.dimensiones, ancho: e.target.value}})} className="px-2 py-2 border border-gray-300 rounded-lg" />
                                <input type="number" placeholder="Prof." value={nuevoProducto.dimensiones.profundidad} onChange={(e) => setNuevoProducto({...nuevoProducto, dimensiones: {...nuevoProducto.dimensiones, profundidad: e.target.value}})} className="px-2 py-2 border border-gray-300 rounded-lg" />
                            </div>
                            
                            <div className="md:col-span-2 mt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Producto (para generación 3D)</label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageUpload}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                                />
                                {uploadingImage && <p className="text-sm text-blue-600 mt-1">Subiendo imagen...</p>}
                                {nuevoProducto.imagen && <p className="text-sm text-green-600 mt-1">✅ Imagen subida correctamente</p>}
                            </div>
                        </>
                      )}

                      {nuevoProducto.tipo === 'Materia Prima' && (
                          <>
                            <input type="number" placeholder="Precio Compra" value={nuevoProducto.precioCompra} onChange={(e) => setNuevoProducto({...nuevoProducto, precioCompra: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                            <input type="number" placeholder="Precio Venta" value={nuevoProducto.precioVenta} onChange={(e) => setNuevoProducto({...nuevoProducto, precioVenta: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg" />
                          </>
                      )}

                      <div className="md:col-span-2">
                        <button onClick={handleCrearProducto} className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700 font-semibold">
                            {nuevoProducto.tipo === 'Materia Prima' ? 'Guardar Materia Prima' : 'Guardar Producto Terminado'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Products Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700">
                                <th className="py-3 px-4 font-semibold">Producto</th>
                                <th className="py-3 px-4 font-semibold text-right">Cantidad</th>
                                <th className="py-3 px-4 font-semibold text-right">Costo Unit.</th>
                                <th className="py-3 px-4 font-semibold text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {compra.productos.map((p, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div className="font-medium text-gray-800">{p.productoNombre}</div>
                                        <div className="text-sm text-gray-500">{p.codigo || 'N/A'}</div>
                                    </td>
                                    <td className="text-right py-3 px-4">{p.cantidad}</td>
                                    <td className="text-right py-3 px-4">Bs. {p.costoUnitario.toFixed(2)}</td>
                                    <td className="text-right py-3 px-4">Bs. {p.costoTotal.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- Totals and Payment Section --- */}
                <div className="border-t pt-6 mt-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Pago y Confirmación</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Payment Methods */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">Métodos de Pago</h3>
                      <div className="space-y-4">
                        {metodosPagoOptions.map(metodo => (
                          <div key={metodo} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <label className="text-md font-medium text-gray-800">{metodo}</label>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600">Bs.</span>
                              <input
                                type="number"
                                step="0.01"
                                value={pagos[metodo]}
                                onChange={(e) => handlePagoChange(metodo, parseFloat(e.target.value) || 0)}
                                className="w-32 px-3 py-1 border border-gray-300 rounded-md text-right"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        ))}
                        {pagos.Cheque > 0 && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del Cheque</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setChequeImage(e.target.files[0])}
                              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                      <h3 className="text-xl font-bold text-purple-800 mb-4">Resumen de la Compra</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-lg">
                          <span className="text-gray-700">Subtotal:</span>
                          <span className="font-semibold text-gray-800">Bs. {totalCompra.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg">
                          <span className="text-gray-700">Total Pagado:</span>
                          <span className="font-semibold text-green-600">Bs. {totalPagado.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold border-t pt-3 mt-3">
                          <span className="text-purple-800">Saldo Pendiente:</span>
                          <span className="text-red-600">Bs. {(totalCompra - totalPagado).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="mt-6">
                        <button
                          onClick={confirmarCompra}
                          disabled={compra.productos.length === 0 || totalPagado > totalCompra}
                          className="w-full bg-purple-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          Confirmar y Registrar Compra
                        </button>
                        {totalPagado > totalCompra && (
                          <p className="text-red-500 text-sm mt-2 text-center">El total pagado no puede ser mayor al total de la compra.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  ); 

};

export default ComprasPage;
