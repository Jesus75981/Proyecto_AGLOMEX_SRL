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

const InventarioPage = ({ userRole }) => {
  const navigate = useNavigate();

  // ✅ Volver al HOME
  const volverAlHome = () => {
    navigate('/home');
  };

  // Estados principales
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('productos');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Estados para búsqueda en formularios
  const [categoriaSearch, setCategoriaSearch] = useState('');
  const [proveedorSearch, setProveedorSearch] = useState('');
  const [productoSearch, setProductoSearch] = useState('');
  const [showCategoriaDropdown, setShowCategoriaDropdown] = useState(false);
  const [showProveedorDropdown, setShowProveedorDropdown] = useState(false);
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);

  // Estados para modificar producto
  const [modificarProducto, setModificarProducto] = useState({
    nombre: '',
    descripcion: '',
    color: '',
    categoria: '',
    marca: '',
    cajas: '',
    ubicacion: '',
    tamano: '',
    codigo: '',
    precioCompra: '',
    precioVenta: '',
    cantidad: '',
    imagen: ''
  });
  const [showModificarForm, setShowModificarForm] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);

  // Estado para formulario de movimiento
  const [showMovimientoForm, setShowMovimientoForm] = useState(false);

  // Datos de API - Inventario
  const [inventario, setInventario] = useState([]);
  const [productosAPI, setProductosAPI] = useState([]);

  // Movimientos de inventario
  const [movimientos, setMovimientos] = useState([
    {
      id: 1,
      producto: 'Silla Ejecutiva Ergonomica',
      sku: 'SCH-EXEC-001',
      tipo: 'Salida',
      cantidad: 5,
      motivo: 'Venta a cliente',
      referencia: 'PED-001',
      usuario: 'Juan Pérez',
      fecha: '2024-01-15 10:30:00',
      stockAnterior: 155,
      stockActual: 150
    },
    {
      id: 2,
      producto: 'Mesa de Centro Moderna',
      sku: 'MES-CENT-002',
      tipo: 'Entrada',
      cantidad: 20,
      motivo: 'Compra a proveedor',
      referencia: 'COMP-001',
      usuario: 'María García',
      fecha: '2024-01-14 14:15:00',
      stockAnterior: 55,
      stockActual: 75
    },
    {
      id: 3,
      producto: 'Sofá 3 Plazas Cuero',
      sku: 'SOF-3PL-003',
      tipo: 'Salida',
      cantidad: 2,
      motivo: 'Venta a cliente',
      referencia: 'PED-002',
      usuario: 'Carlos López',
      fecha: '2024-01-16 09:45:00',
      stockAnterior: 10,
      stockActual: 8
    },
    {
      id: 4,
      producto: 'Escritorio Oficina Profesional',
      sku: 'ESC-OFI-005',
      tipo: 'Ajuste',
      cantidad: 3,
      motivo: 'Ajuste por inventario físico',
      referencia: 'AJUST-001',
      usuario: 'Ana Martínez',
      fecha: '2024-01-13 16:20:00',
      stockAnterior: 22,
      stockActual: 25
    }
  ]);

  // Cuentas por pagar
  const [deudas, setDeudas] = useState([]);

  // Categorías
  const categorias = ['Sillas', 'Mesas', 'Sofás', 'Estanterías', 'Escritorios', 'Iluminación', 'Accesorios'];

  // Proveedores
  const proveedores = [
    'Muebles Premium SA',
    'Diseño Contemporáneo SL',
    'Confort Hogar SA',
    'Maderas Nobles SL',
    'Oficina Moderna SA',
    'Iluminación Creativa SL'
  ];

  // Formularios
  const [nuevoProducto, setNuevoProducto] = useState({
    producto: '',
    sku: '',
    categoria: '',
    proveedor: '',
    cantidad: '',
    cantidadMinima: '',
    cantidadMaxima: '',
    ubicacion: '',
    precioCosto: '',
    precioVenta: ''
  });

  const [erroresProducto, setErroresProducto] = useState({});

  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    productoId: '',
    tipo: 'Entrada',
    cantidad: '',
    motivo: '',
    referencia: '',
    usuario: ''
  });

  const [erroresMovimiento, setErroresMovimiento] = useState({});

  // Filtrar datos
  const inventarioFiltrado = inventario.filter(item =>
    item.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const movimientosFiltrados = movimientos.filter(mov =>
    mov.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.motivo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Validaciones para productos
  const validarProducto = () => {
    const errores = {};

    if (!nuevoProducto.producto.trim()) {
      errores.producto = 'El nombre del producto es obligatorio';
    }

    if (!nuevoProducto.sku.trim()) {
      errores.sku = 'El SKU es obligatorio';
    }

    if (!nuevoProducto.categoria) {
      errores.categoria = 'Debe seleccionar una categoría';
    }

    if (!nuevoProducto.proveedor) {
      errores.proveedor = 'Debe seleccionar un proveedor';
    }

    // Validaciones numéricas
    if (nuevoProducto.cantidad === '' || isNaN(nuevoProducto.cantidad) || parseInt(nuevoProducto.cantidad) < 0) {
      errores.cantidad = 'La cantidad debe ser un número entero positivo o cero';
    }

    if (nuevoProducto.cantidadMinima === '' || isNaN(nuevoProducto.cantidadMinima) || parseInt(nuevoProducto.cantidadMinima) < 0) {
      errores.cantidadMinima = 'El stock mínimo debe ser un número entero positivo o cero';
    }

    if (nuevoProducto.cantidadMaxima === '' || isNaN(nuevoProducto.cantidadMaxima) || parseInt(nuevoProducto.cantidadMaxima) < 0) {
      errores.cantidadMaxima = 'El stock máximo debe ser un número entero positivo';
    }

    if (nuevoProducto.precioCosto === '' || isNaN(nuevoProducto.precioCosto) || parseFloat(nuevoProducto.precioCosto) < 0) {
      errores.precioCosto = 'El precio de costo debe ser un número positivo';
    }

    if (nuevoProducto.precioVenta === '' || isNaN(nuevoProducto.precioVenta) || parseFloat(nuevoProducto.precioVenta) < 0) {
      errores.precioVenta = 'El precio de venta debe ser un número positivo';
    }

    // Validar que precio venta sea mayor que precio costo
    if (!errores.precioCosto && !errores.precioVenta && parseFloat(nuevoProducto.precioVenta) < parseFloat(nuevoProducto.precioCosto)) {
      errores.precioVenta = 'El precio de venta debe ser mayor o igual al precio de costo';
    }

    setErroresProducto(errores);
    return Object.keys(errores).length === 0;
  };

  // Funciones para productos
  const agregarProducto = () => {
    if (!validarProducto()) return;

    const producto = {
      id: inventario.length + 1,
      ...nuevoProducto,
      cantidad: parseInt(nuevoProducto.cantidad),
      cantidadMinima: parseInt(nuevoProducto.cantidadMinima),
      cantidadMaxima: parseInt(nuevoProducto.cantidadMaxima),
      precioCosto: parseFloat(nuevoProducto.precioCosto),
      precioVenta: parseFloat(nuevoProducto.precioVenta),
      estado: parseInt(nuevoProducto.cantidad) <= 0 ? 'Agotado' :
              parseInt(nuevoProducto.cantidad) <= parseInt(nuevoProducto.cantidadMinima) ? 'Stock Bajo' : 'Disponible',
      fechaIngreso: new Date().toISOString().split('T')[0],
      ultimaActualizacion: new Date().toISOString().split('T')[0]
    };

    setInventario([...inventario, producto]);
    setNuevoProducto({
      producto: '',
      sku: '',
      categoria: '',
      proveedor: '',
      cantidad: '',
      cantidadMinima: '',
      cantidadMaxima: '',
      ubicacion: '',
      precioCosto: '',
      precioVenta: ''
    });
    setErroresProducto({});
    setShowForm(false);
  };

  const eliminarProducto = (id) => {
    setInventario(inventario.filter(item => item.id !== id));
  };

  // Función para iniciar edición de producto
  const iniciarEdicion = (item) => {
    const productoCompleto = productosAPI.find(p => p._id === item.id);
    if (productoCompleto) {
      setModificarProducto({
        nombre: productoCompleto.nombre || '',
        descripcion: productoCompleto.descripcion || '',
        color: productoCompleto.color || '',
        categoria: productoCompleto.categoria || '',
        marca: productoCompleto.marca || '',
        cajas: productoCompleto.cajas || '',
        ubicacion: productoCompleto.ubicacion || '',
        tamano: productoCompleto.tamano || '',
        codigo: productoCompleto.idProductoTienda || '',
        precioCompra: productoCompleto.precioCompra || '',
        precioVenta: productoCompleto.precioVenta || '',
        cantidad: productoCompleto.cantidad || '',
        imagen: productoCompleto.imagen || ''
      });
      setProductoEditando(productoCompleto);
      setShowModificarForm(true);
    }
  };

  // Validación para modificar producto
  const validarModificarProducto = () => {
    const errores = {};
    if (!modificarProducto.nombre.trim()) {
      errores.nombre = 'El nombre es obligatorio';
    }
    if (!modificarProducto.categoria) {
      errores.categoria = 'Debe seleccionar una categoría';
    }
    if (modificarProducto.cantidad === '' || isNaN(modificarProducto.cantidad) || parseInt(modificarProducto.cantidad) < 0) {
      errores.cantidad = 'La cantidad debe ser un número entero positivo o cero';
    }
    if (modificarProducto.precioCompra === '' || isNaN(modificarProducto.precioCompra) || parseFloat(modificarProducto.precioCompra) < 0) {
      errores.precioCompra = 'El precio de compra debe ser un número positivo';
    }
    if (modificarProducto.precioVenta === '' || isNaN(modificarProducto.precioVenta) || parseFloat(modificarProducto.precioVenta) < 0) {
      errores.precioVenta = 'El precio de venta debe ser un número positivo';
    }
    if (!errores.precioCompra && !errores.precioVenta && parseFloat(modificarProducto.precioVenta) < parseFloat(modificarProducto.precioCompra)) {
      errores.precioVenta = 'El precio de venta debe ser mayor o igual al precio de compra';
    }
    setErroresProducto(errores);
    return Object.keys(errores).length === 0;
  };

  // Función para modificar producto
  const modificarProductoFunc = async () => {
    if (!validarModificarProducto()) return;
    try {
      const updatedProduct = {
        nombre: modificarProducto.nombre,
        descripcion: modificarProducto.descripcion,
        color: modificarProducto.color,
        categoria: modificarProducto.categoria,
        marca: modificarProducto.marca,
        cajas: modificarProducto.cajas,
        ubicacion: modificarProducto.ubicacion,
        tamano: modificarProducto.tamano,
        idProductoTienda: modificarProducto.codigo,
        precioCompra: parseFloat(modificarProducto.precioCompra),
        precioVenta: parseFloat(modificarProducto.precioVenta),
        cantidad: parseInt(modificarProducto.cantidad),
        imagen: modificarProducto.imagen
      };
      await apiFetch(`/productos/${productoEditando._id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedProduct)
      });
      // Recargar productos
      const productos = await apiFetch('/productos');
      setProductosAPI(productos);
      const inventarioMapeado = productos.map((prod) => ({
        id: prod._id,
        producto: prod.nombre,
        sku: prod.idProductoTienda,
        categoria: prod.categoria,
        proveedor: prod.proveedor?.nombre || 'Sin proveedor',
        cantidad: prod.cantidad || 0,
        cantidadMinima: 5,
        cantidadMaxima: 100,
        ubicacion: prod.ubicacion || '',
        precioCosto: prod.precioCompra || 0,
        precioVenta: prod.precioVenta || 0,
        estado: (prod.cantidad || 0) <= 0 ? 'Agotado' :
                (prod.cantidad || 0) <= 5 ? 'Stock Bajo' : 'Disponible',
        fechaIngreso: prod.createdAt ? new Date(prod.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        ultimaActualizacion: prod.updatedAt ? new Date(prod.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }));
      setInventario(inventarioMapeado);
      setShowModificarForm(false);
      setProductoEditando(null);
    } catch (err) {
      console.error('Error modificando producto:', err);
      setError('Error al modificar el producto');
    }
  };

  // Validaciones para movimientos
  const validarMovimiento = () => {
    const errores = {};

    if (!nuevoMovimiento.productoId) {
      errores.productoId = 'Debe seleccionar un producto';
    }

    if (nuevoMovimiento.cantidad === '' || isNaN(nuevoMovimiento.cantidad) || parseInt(nuevoMovimiento.cantidad) <= 0) {
      errores.cantidad = 'La cantidad debe ser un número entero positivo';
    }

    if (!nuevoMovimiento.motivo.trim()) {
      errores.motivo = 'El motivo es obligatorio';
    }

    // Validación adicional para salidas: verificar stock disponible
    if (nuevoMovimiento.tipo === 'Salida' && nuevoMovimiento.productoId && nuevoMovimiento.cantidad) {
      const producto = inventario.find(p => p.id === parseInt(nuevoMovimiento.productoId));
      if (producto && parseInt(nuevoMovimiento.cantidad) > producto.cantidad) {
        errores.cantidad = `No hay suficiente stock. Disponible: ${producto.cantidad}`;
      }
    }

    setErroresMovimiento(errores);
    return Object.keys(errores).length === 0;
  };

  // Funciones para movimientos
  const agregarMovimiento = () => {
    if (!validarMovimiento()) return;

    const producto = inventario.find(p => p.id === parseInt(nuevoMovimiento.productoId));
    if (!producto) return;

    const stockAnterior = producto.cantidad;
    let stockActual = stockAnterior;

    if (nuevoMovimiento.tipo === 'Entrada') {
      stockActual = stockAnterior + parseInt(nuevoMovimiento.cantidad);
    } else if (nuevoMovimiento.tipo === 'Salida') {
      stockActual = stockAnterior - parseInt(nuevoMovimiento.cantidad);
    } else {
      stockActual = parseInt(nuevoMovimiento.cantidad);
    }

    // Actualizar inventario
    setInventario(inventario.map(item =>
      item.id === parseInt(nuevoMovimiento.productoId)
        ? {
            ...item,
            cantidad: stockActual,
            estado: stockActual <= 0 ? 'Agotado' :
                    stockActual <= item.cantidadMinima ? 'Stock Bajo' : 'Disponible',
            ultimaActualizacion: new Date().toISOString().split('T')[0]
          }
        : item
    ));

    // Agregar movimiento
    const movimiento = {
      id: movimientos.length + 1,
      producto: producto.producto,
      sku: producto.sku,
      tipo: nuevoMovimiento.tipo,
      cantidad: parseInt(nuevoMovimiento.cantidad),
      motivo: nuevoMovimiento.motivo,
      referencia: nuevoMovimiento.referencia,
      usuario: nuevoMovimiento.usuario || 'Usuario Actual',
      fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
      stockAnterior,
      stockActual
    };

    setMovimientos([movimiento, ...movimientos]);
    setNuevoMovimiento({
      productoId: '',
      tipo: 'Entrada',
      cantidad: '',
      motivo: '',
      referencia: '',
      usuario: ''
    });
    setErroresMovimiento({});
    setShowMovimientoForm(false);
  };

  // Cargar productos desde API
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const productos = await apiFetch('/productos');
        setProductosAPI(productos);

        // Mapear productos de API al formato del inventario
        const inventarioMapeado = productos.map((prod, index) => ({
          id: prod._id,
          producto: prod.nombre,
          sku: prod.idProductoTienda,
          categoria: prod.categoria,
          proveedor: prod.proveedor?.nombre || 'Sin proveedor',
          cantidad: prod.cantidad || 0,
          cantidadMinima: 5, // Valor por defecto, podría venir de la API
          cantidadMaxima: 100, // Valor por defecto
          ubicacion: prod.ubicacion || '',
          precioCosto: prod.precioCompra || 0,
          precioVenta: prod.precioVenta || 0,
          estado: (prod.cantidad || 0) <= 0 ? 'Agotado' :
                  (prod.cantidad || 0) <= 5 ? 'Stock Bajo' : 'Disponible',
          fechaIngreso: prod.createdAt ? new Date(prod.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          ultimaActualizacion: prod.updatedAt ? new Date(prod.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }));

        setInventario(inventarioMapeado);
        setLoading(false);
      } catch (err) {
        console.error('Error cargando productos:', err);
        setError('Error al cargar los productos');
        setLoading(false);
      }
    };

    cargarProductos();
  }, []);

  // Cálculos de métricas
  const totalProductos = inventario.length;
  const productosDisponibles = inventario.filter(p => p.estado === 'Disponible').length;
  const productosStockBajo = inventario.filter(p => p.estado === 'Stock Bajo').length;
  const productosAgotados = inventario.filter(p => p.estado === 'Agotado').length;

  const valorTotalInventario = inventario.reduce((sum, item) =>
    sum + (item.cantidad * item.precioCosto), 0
  );

  const movimientosHoy = movimientos.filter(mov =>
    mov.fecha.startsWith(new Date().toISOString().split('T')[0])
  ).length;

  const productosReorden = inventario.filter(item =>
    item.cantidad <= item.cantidadMinima
  ).length;

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
              <span className="text-sm text-gray-600">Módulo de Inventario</span>
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
            <h1 className="text-4xl font-bold text-green-600 mb-2">Módulo de Inventario</h1>
            <p className="text-gray-600 text-lg">Gestión completa de stock y productos</p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Total Productos</h3>
                  <p className="text-2xl font-bold text-gray-800">{totalProductos}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <span className="text-green-600 text-xl">📦</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Valor Inventario</h3>
                  <p className="text-2xl font-bold text-gray-800">Bs {valorTotalInventario.toFixed(2)}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <span className="text-blue-600 text-xl">💰</span>
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
                  <h3 className="text-sm font-semibold text-gray-600">Necesitan Reorden</h3>
                  <p className="text-2xl font-bold text-gray-800">{productosReorden}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <span className="text-red-600 text-xl">🔄</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pestañas */}
          <div className="bg-white rounded-xl shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {['productos', 'movimientos'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab === 'productos' && '📦 Gestión de Productos'}
                    {tab === 'movimientos' && '🔄 Movimientos'}
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
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                🔍
              </div>
            </div>
          </div>

          {/* Contenido de Pestañas */}
          {activeTab === 'productos' && (
            <div className="space-y-6">
              {/* Formulario de Nuevo Producto */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Gestión de Productos</h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowMovimientoForm(!showMovimientoForm)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                    >
                      {showMovimientoForm ? 'Cancelar Movimiento' : '+ Movimiento'}
                    </button>
                    <button
                      onClick={() => setShowForm(!showForm)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                    >
                      {showForm ? 'Cancelar' : '+ Nuevo Producto'}
                    </button>
                  </div>
                </div>
                
                {/* Formulario Nuevo Producto */}
                {showForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="Nombre del producto"
                      value={nuevoProducto.producto}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, producto: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="SKU"
                      value={nuevoProducto.sku}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, sku: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar categoría"
                        value={nuevoProducto.categoria}
                        onChange={(e) => {
                          setNuevoProducto({...nuevoProducto, categoria: e.target.value});
                          setShowCategoriaDropdown(true);
                        }}
                        onFocus={() => setShowCategoriaDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCategoriaDropdown(false), 200)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                      />
                      {showCategoriaDropdown && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {categorias.filter(cat => cat.toLowerCase().includes(nuevoProducto.categoria.toLowerCase())).map(cat => (
                            <div
                              key={cat}
                              onClick={() => {
                                setNuevoProducto({...nuevoProducto, categoria: cat});
                                setShowCategoriaDropdown(false);
                              }}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              {cat}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar proveedor"
                        value={nuevoProducto.proveedor}
                        onChange={(e) => {
                          setNuevoProducto({...nuevoProducto, proveedor: e.target.value});
                          setShowProveedorDropdown(true);
                        }}
                        onFocus={() => setShowProveedorDropdown(true)}
                        onBlur={() => setTimeout(() => setShowProveedorDropdown(false), 200)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                      />
                      {showProveedorDropdown && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {proveedores.filter(prov => prov.toLowerCase().includes(nuevoProducto.proveedor.toLowerCase())).map(prov => (
                            <div
                              key={prov}
                              onClick={() => {
                                setNuevoProducto({...nuevoProducto, proveedor: prov});
                                setShowProveedorDropdown(false);
                              }}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              {prov}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="number"
                      placeholder="Cantidad inicial"
                      value={nuevoProducto.cantidad}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, cantidad: parseInt(e.target.value) || 0})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      placeholder="Stock mínimo"
                      value={nuevoProducto.cantidadMinima}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, cantidadMinima: parseInt(e.target.value) || 0})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      placeholder="Stock máximo"
                      value={nuevoProducto.cantidadMaxima}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, cantidadMaxima: parseInt(e.target.value) || 0})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Ubicación en almacén"
                      value={nuevoProducto.ubicacion}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, ubicacion: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Precio costo"
                      value={nuevoProducto.precioCosto}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, precioCosto: parseFloat(e.target.value) || 0})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Precio venta"
                      value={nuevoProducto.precioVenta}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, precioVenta: parseFloat(e.target.value) || 0})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div className="md:col-span-3 flex space-x-4">
                      <button
                        onClick={agregarProducto}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                      >
                        Agregar Producto
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

                {/* Formulario Movimiento */}
                {showMovimientoForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar producto"
                        value={nuevoMovimiento.productoId ? inventario.find(p => p.id === parseInt(nuevoMovimiento.productoId))?.producto || '' : ''}
                        onChange={(e) => {
                          setNuevoMovimiento({...nuevoMovimiento, productoId: ''});
                          setProductoSearch(e.target.value);
                          setShowProductoDropdown(true);
                        }}
                        onFocus={() => setShowProductoDropdown(true)}
                        onBlur={() => setTimeout(() => setShowProductoDropdown(false), 200)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      />
                      {showProductoDropdown && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {inventario.filter(prod => prod.producto.toLowerCase().includes(productoSearch.toLowerCase())).map(prod => (
                            <div
                              key={prod.id}
                              onClick={() => {
                                setNuevoMovimiento({...nuevoMovimiento, productoId: prod.id.toString()});
                                setProductoSearch(prod.producto);
                                setShowProductoDropdown(false);
                              }}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              {prod.producto} - Stock: {prod.cantidad}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <select
                      value={nuevoMovimiento.tipo}
                      onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, tipo: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Entrada">Entrada</option>
                      <option value="Salida">Salida</option>
                      <option value="Ajuste">Ajuste</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Cantidad"
                      value={nuevoMovimiento.cantidad}
                      onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, cantidad: parseInt(e.target.value) || 0})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Motivo"
                      value={nuevoMovimiento.motivo}
                      onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, motivo: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Referencia (OPCIONAL)"
                      value={nuevoMovimiento.referencia}
                      onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, referencia: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Usuario"
                      value={nuevoMovimiento.usuario}
                      onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, usuario: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="md:col-span-2 flex space-x-4">
                      <button
                        onClick={agregarMovimiento}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                      >
                        Registrar Movimiento
                      </button>
                      <button
                        onClick={() => setShowMovimientoForm(false)}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Formulario Modificar Producto */}
                {showModificarForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-green-50 rounded-lg">
                    <h3 className="md:col-span-3 text-lg font-semibold text-gray-800 mb-2">Editar Producto</h3>
                    <input
                      type="text"
                      placeholder="Nombre del producto"
                      value={modificarProducto.nombre}
                      onChange={(e) => setModificarProducto({...modificarProducto, nombre: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Descripción"
                      value={modificarProducto.descripcion}
                      onChange={(e) => setModificarProducto({...modificarProducto, descripcion: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Color"
                      value={modificarProducto.color}
                      onChange={(e) => setModificarProducto({...modificarProducto, color: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Categoría"
                      value={modificarProducto.categoria}
                      onChange={(e) => setModificarProducto({...modificarProducto, categoria: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Marca"
                      value={modificarProducto.marca}
                      onChange={(e) => setModificarProducto({...modificarProducto, marca: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Cajas"
                      value={modificarProducto.cajas}
                      onChange={(e) => setModificarProducto({...modificarProducto, cajas: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Ubicación"
                      value={modificarProducto.ubicacion}
                      onChange={(e) => setModificarProducto({...modificarProducto, ubicacion: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Tamaño"
                      value={modificarProducto.tamano}
                      onChange={(e) => setModificarProducto({...modificarProducto, tamano: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Código"
                      value={modificarProducto.codigo}
                      onChange={(e) => setModificarProducto({...modificarProducto, codigo: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Precio Compra"
                      value={modificarProducto.precioCompra}
                      onChange={(e) => setModificarProducto({...modificarProducto, precioCompra: parseFloat(e.target.value) || 0})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Precio Venta"
                      value={modificarProducto.precioVenta}
                      onChange={(e) => setModificarProducto({...modificarProducto, precioVenta: parseFloat(e.target.value) || 0})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      placeholder="Cantidad"
                      value={modificarProducto.cantidad}
                      onChange={(e) => setModificarProducto({...modificarProducto, cantidad: parseInt(e.target.value) || 0})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Imagen URL"
                      value={modificarProducto.imagen}
                      onChange={(e) => setModificarProducto({...modificarProducto, imagen: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div className="md:col-span-3 flex space-x-4">
                      <button
                        onClick={modificarProductoFunc}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                      >
                        Guardar Cambios
                      </button>
                      <button
                        onClick={() => setShowModificarForm(false)}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de Productos */}
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Inventario Actual</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
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
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {item.proveedor}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <span className={`font-semibold ${
                                item.cantidad <= item.cantidadMinima ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {item.cantidad}
                              </span>
                              <div className="text-xs text-gray-500">
                                Min: {item.cantidadMinima} | Max: {item.cantidadMaxima}
                              </div>
                            </div>
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
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div className="font-semibold">Bs {(item.cantidad * item.precioCosto).toFixed(2)}</div>
                            <div className="text-xs text-gray-500">
                              Costo: Bs {item.precioCosto}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => iniciarEdicion(item)}
                                className="text-green-600 hover:text-green-900 text-xs"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  setNuevoMovimiento({
                                    ...nuevoMovimiento,
                                    productoId: item.id.toString()
                                  });
                                  setShowMovimientoForm(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 text-xs"
                              >
                                Movimiento
                              </button>
                              <button
                                onClick={() => eliminarProducto(item.id)}
                                className="text-red-600 hover:text-red-900 text-xs"
                              >
                                Eliminar
                              </button>
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

          {activeTab === 'movimientos' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Historial de Movimientos</h2>
                
                {/* Métricas de Movimientos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="text-sm font-semibold text-green-800">Entradas Hoy</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {movimientos.filter(m => m.tipo === 'Entrada' && m.fecha.startsWith(new Date().toISOString().split('T')[0])).length}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="text-sm font-semibold text-red-800">Salidas Hoy</h3>
                    <p className="text-2xl font-bold text-red-600">
                      {movimientos.filter(m => m.tipo === 'Salida' && m.fecha.startsWith(new Date().toISOString().split('T')[0])).length}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-800">Total Movimientos</h3>
                    <p className="text-2xl font-bold text-blue-600">{movimientos.length}</p>
                  </div>
                </div>

                {/* Lista de Movimientos */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {movimientosFiltrados.map((mov) => (
                        <tr key={mov.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {mov.fecha}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {mov.producto}
                            <div className="text-xs text-gray-500">{mov.sku}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              mov.tipo === 'Entrada' ? 'bg-green-100 text-green-800' :
                              mov.tipo === 'Salida' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {mov.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {mov.tipo === 'Entrada' ? '+' : '-'}{mov.cantidad}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {mov.motivo}
                            {mov.referencia && (
                              <div className="text-xs text-blue-600">Ref: {mov.referencia}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {mov.usuario}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            <div className="text-xs">
                              <span className="text-gray-400">{mov.stockAnterior}</span>
                              <span className="mx-1">→</span>
                              <span className="font-semibold">{mov.stockActual}</span>
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


        </div>
      </div>
    </div>
  );
};

export default InventarioPage;