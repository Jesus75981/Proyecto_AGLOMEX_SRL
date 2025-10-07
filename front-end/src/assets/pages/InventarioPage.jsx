import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [showMovimientoForm, setShowMovimientoForm] = useState(false);

  // Datos de ejemplo - Inventario
  const [inventario, setInventario] = useState([
    {
      id: 1,
      producto: 'Silla Ejecutiva Ergonomica',
      sku: 'SCH-EXEC-001',
      categoria: 'Sillas',
      proveedor: 'Muebles Premium SA',
      cantidad: 150,
      cantidadMinima: 20,
      cantidadMaxima: 200,
      ubicacion: 'Almacén A - Pasillo 1 - Estante 3',
      estado: 'Disponible',
      precioCosto: 120.00,
      precioVenta: 199.99,
      fechaIngreso: '2024-01-10',
      ultimaActualizacion: '2024-01-15'
    },
    {
      id: 2,
      producto: 'Mesa de Centro Moderna',
      sku: 'MES-CENT-002',
      categoria: 'Mesas',
      proveedor: 'Diseño Contemporáneo SL',
      cantidad: 75,
      cantidadMinima: 15,
      cantidadMaxima: 100,
      ubicacion: 'Almacén A - Pasillo 2 - Estante 1',
      estado: 'Disponible',
      precioCosto: 85.50,
      precioVenta: 149.99,
      fechaIngreso: '2024-01-12',
      ultimaActualizacion: '2024-01-16'
    },
    {
      id: 3,
      producto: 'Sofá 3 Plazas Cuero',
      sku: 'SOF-3PL-003',
      categoria: 'Sofás',
      proveedor: 'Confort Hogar SA',
      cantidad: 8,
      cantidadMinima: 5,
      cantidadMaxima: 25,
      ubicacion: 'Almacén B - Pasillo 1 - Estante 2',
      estado: 'Stock Bajo',
      precioCosto: 450.00,
      precioVenta: 799.99,
      fechaIngreso: '2024-01-05',
      ultimaActualizacion: '2024-01-17'
    },
    {
      id: 4,
      producto: 'Estantería Moderna Roble',
      sku: 'EST-MOD-004',
      categoria: 'Estanterías',
      proveedor: 'Maderas Nobles SL',
      cantidad: 0,
      cantidadMinima: 10,
      cantidadMaxima: 50,
      ubicacion: 'Almacén B - Pasillo 2 - Estante 4',
      estado: 'Agotado',
      precioCosto: 65.00,
      precioVenta: 119.99,
      fechaIngreso: '2024-01-08',
      ultimaActualizacion: '2024-01-14'
    },
    {
      id: 5,
      producto: 'Escritorio Oficina Profesional',
      sku: 'ESC-OFI-005',
      categoria: 'Escritorios',
      proveedor: 'Oficina Moderna SA',
      cantidad: 25,
      cantidadMinima: 8,
      cantidadMaxima: 40,
      ubicacion: 'Almacén C - Pasillo 1 - Estante 1',
      estado: 'Disponible',
      precioCosto: 95.00,
      precioVenta: 169.99,
      fechaIngreso: '2024-01-11',
      ultimaActualizacion: '2024-01-15'
    },
    {
      id: 6,
      producto: 'Lámpara de Pie Diseño',
      sku: 'LAM-PIE-006',
      categoria: 'Iluminación',
      proveedor: 'Iluminación Creativa SL',
      cantidad: 45,
      cantidadMinima: 10,
      cantidadMaxima: 80,
      ubicacion: 'Almacén C - Pasillo 3 - Estante 2',
      estado: 'Disponible',
      precioCosto: 35.00,
      precioVenta: 69.99,
      fechaIngreso: '2024-01-13',
      ultimaActualizacion: '2024-01-16'
    }
  ]);

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
    cantidad: 0,
    cantidadMinima: 0,
    cantidadMaxima: 0,
    ubicacion: '',
    precioCosto: 0,
    precioVenta: 0
  });

  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    productoId: '',
    tipo: 'Entrada',
    cantidad: 0,
    motivo: '',
    referencia: '',
    usuario: ''
  });

  // Filtrar datos
  const inventarioFiltrado = inventario.filter(item =>
    item.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const movimientosFiltrados = movimientos.filter(mov =>
    mov.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mov.motivo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funciones para productos
  const agregarProducto = () => {
    if (!nuevoProducto.producto || !nuevoProducto.sku) return;

    const producto = {
      id: inventario.length + 1,
      ...nuevoProducto,
      estado: nuevoProducto.cantidad <= 0 ? 'Agotado' : 
              nuevoProducto.cantidad <= nuevoProducto.cantidadMinima ? 'Stock Bajo' : 'Disponible',
      fechaIngreso: new Date().toISOString().split('T')[0],
      ultimaActualizacion: new Date().toISOString().split('T')[0]
    };

    setInventario([...inventario, producto]);
    setNuevoProducto({
      producto: '',
      sku: '',
      categoria: '',
      proveedor: '',
      cantidad: 0,
      cantidadMinima: 0,
      cantidadMaxima: 0,
      ubicacion: '',
      precioCosto: 0,
      precioVenta: 0
    });
    setShowForm(false);
  };

  const eliminarProducto = (id) => {
    setInventario(inventario.filter(item => item.id !== id));
  };

  // Funciones para movimientos
  const agregarMovimiento = () => {
    if (!nuevoMovimiento.productoId || !nuevoMovimiento.cantidad) return;

    const producto = inventario.find(p => p.id === parseInt(nuevoMovimiento.productoId));
    if (!producto) return;

    const stockAnterior = producto.cantidad;
    let stockActual = stockAnterior;

    if (nuevoMovimiento.tipo === 'Entrada') {
      stockActual = stockAnterior + nuevoMovimiento.cantidad;
    } else if (nuevoMovimiento.tipo === 'Salida') {
      stockActual = stockAnterior - nuevoMovimiento.cantidad;
    } else {
      stockActual = nuevoMovimiento.cantidad;
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
      cantidad: nuevoMovimiento.cantidad,
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
      cantidad: 0,
      motivo: '',
      referencia: '',
      usuario: ''
    });
    setShowMovimientoForm(false);
  };

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
                  <p className="text-2xl font-bold text-gray-800">${valorTotalInventario.toFixed(2)}</p>
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
                {['productos', 'movimientos', 'categorias', 'reportes'].map((tab) => (
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
                    {tab === 'categorias' && '📊 Categorías'}
                    {tab === 'reportes' && '📈 Reportes'}
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
                    <select
                      value={nuevoProducto.categoria}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, categoria: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <select
                      value={nuevoProducto.proveedor}
                      onChange={(e) => setNuevoProducto({...nuevoProducto, proveedor: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Seleccionar proveedor</option>
                      {proveedores.map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
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
                    <select
                      value={nuevoMovimiento.productoId}
                      onChange={(e) => setNuevoMovimiento({...nuevoMovimiento, productoId: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar producto</option>
                      {inventario.map(producto => (
                        <option key={producto.id} value={producto.id}>
                          {producto.producto} - Stock: {producto.cantidad}
                        </option>
                      ))}
                    </select>
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

                {/* Lista de Productos */}
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Inventario Actual</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
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
                            <div className="font-semibold">${(item.cantidad * item.precioCosto).toFixed(2)}</div>
                            <div className="text-xs text-gray-500">
                              Costo: ${item.precioCosto}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
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

          {activeTab === 'categorias' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Gestión de Categorías</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categorias.map((categoria, index) => {
                    const productosCategoria = inventario.filter(item => item.categoria === categoria);
                    const valorTotal = productosCategoria.reduce((sum, item) => 
                      sum + (item.cantidad * item.precioCosto), 0
                    );
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-800">{categoria}</h3>
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            {productosCategoria.length} productos
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>📦 Stock total: {productosCategoria.reduce((sum, item) => sum + item.cantidad, 0)}</p>
                          <p>💰 Valor: ${valorTotal.toFixed(2)}</p>
                          <p>⚠️ Stock bajo: {productosCategoria.filter(item => item.estado === 'Stock Bajo').length}</p>
                          <p>❌ Agotados: {productosCategoria.filter(item => item.estado === 'Agotado').length}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reportes' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Reportes de Inventario</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Reporte de Stock Bajo */}
                  <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-3">Productos con Stock Bajo</h3>
                    <div className="space-y-2">
                      {inventario
                        .filter(item => item.estado === 'Stock Bajo')
                        .map(item => (
                          <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded border">
                            <span className="text-sm font-medium">{item.producto}</span>
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              Stock: {item.cantidad}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Reporte de Productos Agotados */}
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <h3 className="text-lg font-semibold text-red-800 mb-3">Productos Agotados</h3>
                    <div className="space-y-2">
                      {inventario
                        .filter(item => item.estado === 'Agotado')
                        .map(item => (
                          <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded border">
                            <span className="text-sm font-medium">{item.producto}</span>
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              Agotado
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Reporte de Valor por Categoría */}
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50 md:col-span-2">
                    <h3 className="text-lg font-semibold text-green-800 mb-3">Valor de Inventario por Categoría</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {categorias.map(categoria => {
                        const productos = inventario.filter(item => item.categoria === categoria);
                        const valor = productos.reduce((sum, item) => sum + (item.cantidad * item.precioCosto), 0);
                        
                        return (
                          <div key={categoria} className="bg-white p-3 rounded border">
                            <div className="font-medium text-gray-800">{categoria}</div>
                            <div className="text-sm text-gray-600">${valor.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">{productos.length} productos</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
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