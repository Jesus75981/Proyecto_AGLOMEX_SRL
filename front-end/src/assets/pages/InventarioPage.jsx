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
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Estados para búsqueda en formularios
  const [categoriaSearch, setCategoriaSearch] = useState('');
  const [proveedorSearch, setProveedorSearch] = useState('');
  const [productoSearch, setProductoSearch] = useState('');
  const [showCategoriaDropdown, setShowCategoriaDropdown] = useState(false);
  const [showProveedorDropdown, setShowProveedorDropdown] = useState(false);
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);

  // Estado para nuevo producto
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    sku: '',
    codigo: '',
    color: '',
    descripcion: '',
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
  const [productoEditando, setProductoEditando] = useState(null);


  // Estado para nuevo movimiento
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    productoId: '',
    tipo: 'Entrada',
    cantidad: '',
    motivo: '',
    referencia: '',
    usuario: ''
  });
  const [erroresMovimiento, setErroresMovimiento] = useState({});

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

  // Estados faltantes
  const [inventario, setInventario] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [showEditarProductoForm, setShowEditarProductoForm] = useState(false);
  const [showMovimientoForm, setShowMovimientoForm] = useState(false);
  const [showModificarForm, setShowModificarForm] = useState(false);
  const [productoSeleccionadoParaEditar, setProductoSeleccionadoParaEditar] = useState('');


  // Cargar productos y movimientos
  const cargarProductos = async () => {
    try {
      setLoading(true);
      // Filtrar solo productos terminados (no materias primas)
      const dataProductos = await apiFetch('/productos?tipo=Producto Terminado');
      const dataMovimientos = await apiFetch('/movimientos');

      setInventario(dataProductos);
      setMovimientos(dataMovimientos);

      // Extraer categorías y proveedores únicos
      const uniqueCategorias = [...new Set(dataProductos.map(p => p.categoria).filter(Boolean))];
      const uniqueProveedores = [...new Set(dataProductos.map(p => p.proveedor).filter(Boolean))];
      setCategorias(uniqueCategorias);
      setProveedores(uniqueProveedores);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar el inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // Agregar Producto
  const agregarProducto = async () => {
    try {
      // Validaciones básicas
      if (!nuevoProducto.nombre || !nuevoProducto.sku || !nuevoProducto.precioVenta) {
        alert('Por favor complete los campos obligatorios');
        return;
      }

      const token = getAuthToken();
      const response = await fetch(`${API_URL}/productos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify(nuevoProducto)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Error en la petición a la API');
      }

      await cargarProductos();
      setShowForm(false);
      setNuevoProducto({
        nombre: '', sku: '', codigo: '', color: '', descripcion: '',
        categoria: '', proveedor: '', cantidad: '', cantidadMinima: '',
        cantidadMaxima: '', ubicacion: '', precioCosto: '', precioVenta: ''
      });
    } catch (err) {
      console.error('Error agregando producto:', err);
      alert('Error al agregar producto: ' + err.message);
    }
  };

  // Eliminar Producto
  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este producto?')) return;
    try {
      await apiFetch(`/productos/${id}`, { method: 'DELETE' });
      await cargarProductos();
    } catch (err) {
      console.error('Error eliminando producto:', err);
      alert('Error al eliminar producto');
    }
  };

  // Iniciar Edición
  const iniciarEdicion = (producto) => {
    prepararModificacion(producto);
  };

  // Agregar Movimiento
  const agregarMovimiento = async () => {
    if (!validarMovimiento()) return;
    try {
      await apiFetch('/movimientos', {
        method: 'POST',
        body: JSON.stringify(nuevoMovimiento)
      });

      await cargarProductos(); // Recargar para actualizar stock
      setShowMovimientoForm(false);
      setNuevoMovimiento({
        productoId: '', tipo: 'Entrada', cantidad: '',
        motivo: '', referencia: '', usuario: ''
      });
    } catch (err) {
      console.error('Error registrando movimiento:', err);
      alert('Error al registrar movimiento');
    }
  };

  const prepararModificacion = (productoCompleto) => {
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
      let response;

      if (selectedImageFile) {
        // Si hay imagen nueva, usar FormData
        const formData = new FormData();
        formData.append('nombre', modificarProducto.nombre);
        formData.append('descripcion', modificarProducto.descripcion);
        formData.append('color', modificarProducto.color);
        formData.append('categoria', modificarProducto.categoria);
        formData.append('marca', modificarProducto.marca);
        formData.append('cajas', modificarProducto.cajas);
        formData.append('ubicacion', modificarProducto.ubicacion);
        formData.append('tamano', modificarProducto.tamano);
        formData.append('idProductoTienda', modificarProducto.codigo);
        formData.append('precioCompra', parseFloat(modificarProducto.precioCompra));
        formData.append('precioVenta', parseFloat(modificarProducto.precioVenta));

        formData.append('imagen', selectedImageFile);

        const token = getAuthToken();
        response = await fetch(`${API_URL}/productos/${productoEditando._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': token ? `Bearer ${token}` : undefined,
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || 'Error en la petición a la API');
        }
      } else {
        // Si no hay imagen nueva, usar JSON normal
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

        };

        response = await apiFetch(`/productos/${productoEditando._id}`, {
          method: 'PUT',
          body: JSON.stringify(updatedProduct)
        });
      }

      await cargarProductos();
      setShowModificarForm(false);
      setProductoEditando(null);
      setSelectedImageFile(null);
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
      const producto = inventario.find(p => p._id === nuevoMovimiento.productoId);
      if (producto && parseInt(nuevoMovimiento.cantidad) > producto.cantidad) {
        errores.cantidad = `No hay suficiente stock. Disponible: ${producto.cantidad}`;
      }
    }
    setErroresMovimiento(errores);
    return Object.keys(errores).length === 0;
  };
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

  // Filtrado
  const inventarioFiltrado = inventario.filter(item =>
    String(item.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.idProductoTienda || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.color || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.categoria || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.proveedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.ubicacion || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const movimientosFiltrados = movimientos.filter(mov =>
    String(mov.producto?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(mov.producto?.idProductoTienda || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(mov.tipo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(mov.motivo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(mov.usuario || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50" >
      {/* Navbar de Navegación */}
      < nav className="bg-white shadow-sm border-b border-gray-200" >
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
      </nav >

      {/* Contenido Principal */}
      < div className="p-6" >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-green-600 mb-2">Módulo de Inventario</h1>
            <p className="text-gray-600 text-lg">Gestión completa de stock y productos</p>
          </div>



          {/* Barra de Búsqueda */}
          {/* Barra de Búsqueda Mejorada */}
          <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 w-full text-gray-700 shadow-sm transition-all duration-200 text-lg"
              />
              <div className="absolute left-4 top-3.5 text-gray-400 text-xl">
                🔍
              </div>
            </div>
          </div>

          {/* Contenido de Pestañas */}
          <div className="space-y-6">

              {/* Formulario de Nuevo Producto */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">Gestión de Productos</h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowEditarProductoForm(!showEditarProductoForm)}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition duration-200"
                    >
                      {showEditarProductoForm ? 'Cancelar Editar' : 'Editar Producto'}
                    </button>
                  </div>
                </div>

                {/* Formulario Nuevo Producto */}
                {showForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="Nombre del producto"
                      value={nuevoProducto.nombre}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="SKU (Interno)"
                      value={nuevoProducto.sku}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, sku: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Código Correlativo (Ej: PROD-001)"
                      value={nuevoProducto.codigo}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, codigo: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Color"
                      value={nuevoProducto.color}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, color: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar categoría"
                        value={nuevoProducto.categoria}
                        onChange={(e) => {
                          setNuevoProducto({ ...nuevoProducto, categoria: e.target.value });
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
                                setNuevoProducto({ ...nuevoProducto, categoria: cat });
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
                          setNuevoProducto({ ...nuevoProducto, proveedor: e.target.value });
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
                                setNuevoProducto({ ...nuevoProducto, proveedor: prov });
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
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: parseFloat(e.target.value) || 0 })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      placeholder="Stock mínimo"
                      value={nuevoProducto.cantidadMinima}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidadMinima: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      placeholder="Stock máximo"
                      value={nuevoProducto.cantidadMaxima}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidadMaxima: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Almacén"
                      value={nuevoProducto.ubicacion}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, ubicacion: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Precio costo"
                      value={nuevoProducto.precioCosto}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, precioCosto: parseFloat(e.target.value) || 0 })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Precio venta"
                      value={nuevoProducto.precioVenta}
                      onChange={(e) => setNuevoProducto({ ...nuevoProducto, precioVenta: parseFloat(e.target.value) || 0 })}
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
                        value={nuevoMovimiento.productoId ? inventario.find(p => p._id === nuevoMovimiento.productoId)?.nombre || '' : ''}
                        onChange={(e) => {
                          setNuevoMovimiento({ ...nuevoMovimiento, productoId: '' });
                          setProductoSearch(e.target.value);
                          setShowProductoDropdown(true);
                        }}
                        onFocus={() => setShowProductoDropdown(true)}
                        onBlur={() => setTimeout(() => setShowProductoDropdown(false), 200)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      />
                      {showProductoDropdown && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {inventario.filter(prod => prod.nombre && prod.nombre.toLowerCase().includes(productoSearch.toLowerCase())).map(prod => (
                            <div
                              key={prod._id}
                              onClick={() => {
                                setNuevoMovimiento({ ...nuevoMovimiento, productoId: prod._id.toString() });
                                setProductoSearch(prod.nombre);
                                setShowProductoDropdown(false);
                              }}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                              {prod.nombre} - Stock: {prod.cantidad}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <select
                      value={nuevoMovimiento.tipo}
                      onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, tipo: e.target.value })}
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
                      onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, cantidad: parseInt(e.target.value) || 0 })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Motivo"
                      value={nuevoMovimiento.motivo}
                      onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, motivo: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Referencia (OPCIONAL)"
                      value={nuevoMovimiento.referencia}
                      onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, referencia: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Usuario"
                      value={nuevoMovimiento.usuario}
                      onChange={(e) => setNuevoMovimiento({ ...nuevoMovimiento, usuario: e.target.value })}
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

                {/* Formulario Editar Producto */}
                {showEditarProductoForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-green-50 rounded-lg">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar producto a editar"
                        value={productoSeleccionadoParaEditar}
                        onChange={(e) => {
                          setProductoSeleccionadoParaEditar(e.target.value);
                          setShowProductoDropdown(true);
                        }}
                        onFocus={() => setShowProductoDropdown(true)}
                        onBlur={() => setTimeout(() => setShowProductoDropdown(false), 200)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                      />
                      {showProductoDropdown && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                          {inventario.filter(prod => prod.nombre && prod.nombre.toLowerCase().includes(productoSeleccionadoParaEditar.toLowerCase())).map(prod => (
                            <div
                              key={prod._id}
                              onClick={() => {
                                setProductoSeleccionadoParaEditar(prod.nombre);
                                iniciarEdicion(prod);
                                setShowEditarProductoForm(false);
                              }}
                              className={`px-4 py-2 cursor-pointer ${prod.cantidad === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                            >
                              {prod.nombre} - SKU: {prod.sku}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setShowEditarProductoForm(false)}
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
                      onChange={(e) => setModificarProducto({ ...modificarProducto, nombre: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Descripción"
                      value={modificarProducto.descripcion}
                      onChange={(e) => setModificarProducto({ ...modificarProducto, descripcion: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Color"
                      value={modificarProducto.color}
                      onChange={(e) => setModificarProducto({ ...modificarProducto, color: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Categoría"
                      value={modificarProducto.categoria}
                      onChange={(e) => setModificarProducto({ ...modificarProducto, categoria: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Marca"
                      value={modificarProducto.marca}
                      onChange={(e) => setModificarProducto({ ...modificarProducto, marca: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Cajas"
                      value={modificarProducto.cajas}
                      onChange={(e) => setModificarProducto({ ...modificarProducto, cajas: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Almacén"
                      value={modificarProducto.ubicacion}
                      onChange={(e) => setModificarProducto({ ...modificarProducto, ubicacion: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Tamaño"
                      value={modificarProducto.tamano}
                      onChange={(e) => setModificarProducto({ ...modificarProducto, tamano: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder="Código"
                      value={modificarProducto.codigo}
                      onChange={(e) => setModificarProducto({ ...modificarProducto, codigo: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />

                    <input
                      type="number"
                      placeholder="Precio Venta"
                      value={modificarProducto.precioVenta}
                      onChange={(e) => setModificarProducto({ ...modificarProducto, precioVenta: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />

                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Producto</label>
                      <input
                        type="file"
                        onChange={(e) => setSelectedImageFile(e.target.files[0])}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    {erroresProducto.nombre && <p className="text-red-500 text-xs">{erroresProducto.nombre}</p>}
                    {erroresProducto.categoria && <p className="text-red-500 text-xs">{erroresProducto.categoria}</p>}
                    {erroresProducto.cantidad && <p className="text-red-500 text-xs">{erroresProducto.cantidad}</p>}
                    {erroresProducto.precioCompra && <p className="text-red-500 text-xs">{erroresProducto.precioCompra}</p>}
                    {erroresProducto.precioVenta && <p className="text-red-500 text-xs">{erroresProducto.precioVenta}</p>}

                    <div className="md:col-span-3 flex space-x-4 mt-4">
                      <button
                        onClick={modificarProductoFunc}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                      >
                        Guardar Cambios
                      </button>
                      <button
                        onClick={() => {
                          setShowModificarForm(false);
                          setProductoEditando(null);
                        }}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Tabla de Productos */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código Proveedor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Venta</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventarioFiltrado.map((item) => {
                        // Calcular estado dinámicamente
                        let estado = 'Disponible';
                        let estadoColor = 'bg-green-100 text-green-800';

                        if (item.cantidad <= 0) {
                          estado = 'Agotado';
                          estadoColor = 'bg-red-100 text-red-800';
                        } else if (item.cantidad <= (item.cantidadMinima || 5)) {
                          estado = 'Stock Bajo';
                          estadoColor = 'bg-yellow-100 text-yellow-800';
                        }

                        return (
                          <tr key={item._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  {item.imagen ? (
                                    <img className="h-10 w-10 rounded-full object-cover cursor-pointer" src={`http://localhost:5000${item.imagen}`} alt="" onClick={() => setSelectedImage(`http://localhost:5000${item.imagen}`)} />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                      📷
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{item.nombre}</div>
                                  <div className="text-sm text-gray-500">{item.descripcion}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.idProductoTienda}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.codigo || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.categoria}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.color || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.cantidad}</div>
                              <div className="text-xs text-gray-500">Min: {item.cantidadMinima || 5}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Bs. {item.precioCompra || 0}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Bs. {item.precioVenta || 0}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoColor}`}>
                                {estado}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button onClick={() => iniciarEdicion(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
                              <button onClick={() => eliminarProducto(item._id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>


        </div>
      </div>

      {/* Modal de Imagen */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
          <div className="max-w-3xl max-h-full p-4">
            <img src={selectedImage} alt="Producto grande" className="max-w-full max-h-[90vh] rounded-lg shadow-xl" />
          </div>
        </div>
      )}
    </div>
  );
};

export default InventarioPage;
