import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api'; // Tu PORT=5000 de server.js

const ComprasPage = ({ userRole }) => {
  const navigate = useNavigate();

  const volverAlHome = () => navigate('/home');

  // Estados (vacíos para DB)
  const [activeSection, setActiveSection] = useState('realizarCompra');
  const [searchTerm, setSearchTerm] = useState('');
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [mostrarResultadosProveedor, setMostrarResultadosProveedor] = useState(false);
  const [mostrarResultadosProducto, setMostrarResultadosProducto] = useState(false);
  const [compra, setCompra] = useState({
    fecha: new Date().toISOString().split('T')[0],
    numeroCompra: `COMP-${Date.now()}`,
    proveedorId: '',
    proveedorNombre: '',
    observaciones: '',
    numeroFactura: '',
    metodoPago: [],
    productos: [],
    anticipos: []
  });
  const [showProveedorForm, setShowProveedorForm] = useState(false);
  const [showProductoForm, setShowProductoForm] = useState(false);
  const [showAnticipoForm, setShowAnticipoForm] = useState(false);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [comprasRegistradas, setComprasRegistradas] = useState([]);
  const [anticipos, setAnticipos] = useState([]);
  const [nuevoProveedor, setNuevoProveedor] = useState({ nombre: '', contacto: '', telefono: '', direccion: '', nit: '', estado: 'Activo' });
  const [nuevoProducto, setNuevoProducto] = useState({ nombre: '', codigo: '', color: '', categoria: '', costoUnitario: 0, precioVenta: 0 });
  const [productoTemporal, setProductoTemporal] = useState({ productoId: '', productoNombre: '', cantidad: 1, costoUnitario: 0 });
  const [nuevoAnticipo, setNuevoAnticipo] = useState({ compraId: '', monto: 0, metodoPago: 'Transferencia', banco: '', fecha: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const metodosPago = ['Efectivo', 'Transferencia', 'Cheque', 'Crédito'];
  const bancos = ['Banco 01', 'Banco 02', 'Banco 03', 'Banco 04'];

  const totalCompra = compra.productos.reduce((total, item) => total + (item.cantidad * item.costoUnitario), 0);
  const totalAnticipos = compra.anticipos.reduce((total, a) => total + a.monto, 0);
  const saldoPendiente = totalCompra - totalAnticipos;

  // Fetch de DB (usa token via defaults)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [prov, prod, comp, anti] = await Promise.all([
          axios.get(`${API_BASE}/proveedores`),
          axios.get(`${API_BASE}/productos`), // Tu ruta productoTiendaRoutes
          axios.get(`${API_BASE}/compras`),
          axios.get(`${API_BASE}/anticipos`) // Si no tienes, comenta o crea ruta
        ]);
        setProveedores(prov.data || []);
        setProductos(prod.data || []);
        setComprasRegistradas(comp.data || []);
        setAnticipos(anti.data || []);
      } catch (err) {
        setError('Error en API: ' + (err.response?.data?.message || err.message));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Búsquedas useEffect (ahora con proveedores de DB)
  useEffect(() => {
    if (busquedaProveedor) {
      const filtrados = proveedores.filter(p => p.nombre.toLowerCase().includes(busquedaProveedor.toLowerCase()) || p.nit.toLowerCase().includes(busquedaProveedor.toLowerCase()));
      setProveedoresFiltrados(filtrados);
      setMostrarResultadosProveedor(true);
    } else {
      setProveedoresFiltrados([]);
      setMostrarResultadosProveedor(false);
    }
  }, [busquedaProveedor, proveedores]);

  useEffect(() => {
    if (busquedaProducto) {
      const filtrados = productos.filter(p => p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) || p.codigo.toLowerCase().includes(busquedaProducto.toLowerCase()) || p.categoria.toLowerCase().includes(busquedaProducto.toLowerCase()));
      setProductosFiltrados(filtrados);
      setMostrarResultadosProducto(true);
    } else {
      setProductosFiltrados([]);
      setMostrarResultadosProducto(false);
    }
  }, [busquedaProducto, productos]);

  // Agregar Proveedor (POST a DB)
  const agregarProveedor = async () => {
    if (!nuevoProveedor.nombre || !nuevoProveedor.nit) return alert('Nombre y NIT requeridos');
    try {
      const res = await axios.post(`${API_BASE}/proveedores`, nuevoProveedor);
      const proveedor = res.data;
      setProveedores([...proveedores, proveedor]);
      setNuevoProveedor({ nombre: '', contacto: '', telefono: '', direccion: '', nit: '', estado: 'Activo' });
      setShowProveedorForm(false);
      setCompra({ ...compra, proveedorId: proveedor._id, proveedorNombre: proveedor.nombre });
      setBusquedaProveedor(proveedor.nombre);
      setMostrarResultadosProveedor(false);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'No se pudo guardar'));
    }
  };

  const seleccionarProveedor = (proveedor) => {
    setCompra({ ...compra, proveedorId: proveedor._id, proveedorNombre: proveedor.nombre });
    setBusquedaProveedor(proveedor.nombre);
    setMostrarResultadosProveedor(false);
  };

  // Agregar Producto (similar)
  const agregarProducto = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.codigo) return alert('Nombre y Código requeridos');
    const payload = { ...nuevoProducto, stock: 0 };
    try {
      const res = await axios.post(`${API_BASE}/productos`, payload);
      const producto = res.data;
      setProductos([...productos, producto]);
      setNuevoProducto({ nombre: '', codigo: '', color: '', categoria: '', costoUnitario: 0, precioVenta: 0 });
      setShowProductoForm(false);
      setProductoTemporal({ productoId: producto._id, productoNombre: producto.nombre, cantidad: 1, costoUnitario: producto.costoUnitario });
      setBusquedaProducto(producto.nombre);
      setMostrarResultadosProducto(false);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'No se pudo guardar'));
    }
  };

  const seleccionarProducto = (producto) => {
    setProductoTemporal({ productoId: producto._id, productoNombre: producto.nombre, cantidad: 1, costoUnitario: producto.costoUnitario });
    setBusquedaProducto(producto.nombre);
    setMostrarResultadosProducto(false);
  };

  const agregarProductoACompra = () => {
    if (!productoTemporal.productoId || !productoTemporal.cantidad) return alert('Producto y cantidad requeridos');
    const prodSel = productos.find(p => p._id === productoTemporal.productoId);
    if (!prodSel) return;
    const productoCompra = {
      id: Date.now(),
      productoId: prodSel._id,
      nombre: prodSel.nombre,
      codigo: prodSel.codigo,
      color: prodSel.color,
      cantidad: productoTemporal.cantidad,
      costoUnitario: productoTemporal.costoUnitario || prodSel.costoUnitario,
      costoTotal: productoTemporal.cantidad * (productoTemporal.costoUnitario || prodSel.costoUnitario)
    };
    setCompra({ ...compra, productos: [...compra.productos, productoCompra] });
    setProductoTemporal({ productoId: '', productoNombre: '', cantidad: 1, costoUnitario: 0 });
    setBusquedaProducto('');
  };

  const eliminarProductoDeCompra = (id) => setCompra({ ...compra, productos: compra.productos.filter(p => p.id !== id) });

  const toggleMetodoPago = (metodo) => {
    const nuevos = compra.metodoPago.includes(metodo) ? compra.metodoPago.filter(m => m !== metodo) : [...compra.metodoPago, metodo];
    setCompra({ ...compra, metodoPago: nuevos });
  };

  const agregarAnticipo = async () => {
    if (!nuevoAnticipo.monto) return alert('Monto requerido');
    const payload = { ...nuevoAnticipo, fecha: new Date().toISOString().split('T')[0] };
    try {
      const res = await axios.post(`${API_BASE}/anticipos`, payload); // Si no tienes ruta, crea
      const anticipo = res.data;
      setCompra({ ...compra, anticipos: [...compra.anticipos, anticipo] });
      setAnticipos([...anticipos, anticipo]);
      setNuevoAnticipo({ compraId: '', monto: 0, metodoPago: 'Transferencia', banco: '', fecha: new Date().toISOString().split('T')[0] });
      setShowAnticipoForm(false);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'No se pudo guardar'));
    }
  };

  const eliminarAnticipo = (id) => setCompra({ ...compra, anticipos: compra.anticipos.filter(a => a.id !== id) });

  const confirmarCompra = async () => {
    if (!compra.proveedorId || compra.productos.length === 0) return alert('Proveedor y productos requeridos');
    const payload = {
      ...compra,
      total: totalCompra,
      estado: saldoPendiente > 0 ? 'Pendiente' : 'Completada'
    };
    try {
      const res = await axios.post(`${API_BASE}/compras`, payload);
      const nueva = res.data;
      setComprasRegistradas([...comprasRegistradas, nueva]);
      setCompra({
        fecha: new Date().toISOString().split('T')[0],
        numeroCompra: `COMP-${Date.now()}`,
        proveedorId: '', proveedorNombre: '', observaciones: '', numeroFactura: '', metodoPago: [], productos: [], anticipos: []
      });
      setBusquedaProveedor(''); setBusquedaProducto('');
      alert('Compra guardada en DB!');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || 'No se pudo guardar'));
    }
  };

  // Filtros
  const comprasFiltradas = comprasRegistradas.filter(c => c.numeroCompra.toLowerCase().includes(searchTerm.toLowerCase()) || c.proveedor.toLowerCase().includes(searchTerm.toLowerCase()));
  const proveedoresFiltradosR = proveedores.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.nit.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando de MongoDB...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error} <button onClick={() => window.location.reload()} className="ml-2 px-2 py-1 bg-blue-500 text-white rounded">Reintentar</button></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button onClick={volverAlHome} className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition">
                <span>←</span> <span>Volver al Home</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Sistema Aglomex</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Módulo de Compras</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{userRole || 'Usuario'}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-purple-600 mb-2">Módulo de Compras</h1>
            <p className="text-gray-600 text-lg">Gestión de compras, proveedores y anticipos</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {[
                  { key: 'realizarCompra', label: '🛒 Realizar Compra' },
                  { key: 'registrarAnticipos', label: '💰 Registrar Anticipos' },
                  { key: 'reporteCompras', label: '📊 Reporte Compras' },
                  { key: 'reporteProveedores', label: '🏢 Reporte Proveedores' }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeSection === item.key ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Search para reportes */}
          {(activeSection === 'reporteCompras' || activeSection === 'reporteProveedores') && (
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Buscar en ${activeSection === 'reporteCompras' ? 'compras' : 'proveedores'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
              </div>
            </div>
          )}

          {/* Sección Realizar Compra */}
          {activeSection === 'realizarCompra' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Realizar Compra</h2>
                {/* Info Básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">FECHA</label>
                    <input type="date" value={compra.fecha} onChange={(e) => setCompra({...compra, fecha: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">NUM DE COMPRA</label>
                    <input type="text" value={compra.numeroCompra} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">PROVEEDOR</label>
                    <div className="flex space-x-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Buscar proveedor..."
                          value={busquedaProveedor}
                          onChange={(e) => setBusquedaProveedor(e.target.value)}
                          onFocus={() => busquedaProveedor && setMostrarResultadosProveedor(true)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        {mostrarResultadosProveedor && proveedoresFiltrados.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {proveedoresFiltrados.map(proveedor => (
                              <div key={proveedor._id} onClick={() => seleccionarProveedor(proveedor)} className="px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                                <div className="font-medium text-gray-800">{proveedor.nombre}</div>
                                <div className="text-sm text-gray-600">NIT: {proveedor.nit} - {proveedor.contacto}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {mostrarResultadosProveedor && proveedoresFiltrados.length === 0 && busquedaProveedor && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                            <div className="px-4 py-3 text-gray-500 text-center">No se encontraron proveedores</div>
                          </div>
                        )}
                      </div>
                      <button onClick={() => setShowProveedorForm(!showProveedorForm)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition whitespace-nowrap">
                        + Crear Proveedor
                      </button>
                    </div>
                    {compra.proveedorNombre && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <span className="text-sm text-green-800">✅ Proveedor seleccionado: <strong>{compra.proveedorNombre}</strong></span>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">OBSERVACIONES</label>
                    <textarea
                      value={compra.observaciones}
                      onChange={(e) => setCompra({...compra, observaciones: e.target.value})}
                      placeholder="Ej: El proveedor enviará la mercadería una vez se cancele el saldo."
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">NUM DE FACTURA</label>
                    <input
                      type="text"
                      value={compra.numeroFactura}
                      onChange={(e) => setCompra({...compra, numeroFactura: e.target.value})}
                      placeholder="Ingrese número de factura"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Form Nuevo Proveedor */}
                {showProveedorForm && (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">Nuevo Proveedor</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input placeholder="Nombre" value={nuevoProveedor.nombre} onChange={(e) => setNuevoProveedor({...nuevoProveedor, nombre: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <input placeholder="NIT" value={nuevoProveedor.nit} onChange={(e) => setNuevoProveedor({...nuevoProveedor, nit: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <input placeholder="Contacto" value={nuevoProveedor.contacto} onChange={(e) => setNuevoProveedor({...nuevoProveedor, contacto: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <input placeholder="Teléfono" value={nuevoProveedor.telefono} onChange={(e) => setNuevoProveedor({...nuevoProveedor, telefono: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <input placeholder="Dirección" value={nuevoProveedor.direccion} onChange={(e) => setNuevoProveedor({...nuevoProveedor, direccion: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg md:col-span-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <div className="md:col-span-2 flex space-x-4">
                        <button onClick={agregarProveedor} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">Guardar</button>
                        <button onClick={() => setShowProveedorForm(false)} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition">Cancelar</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buscar Producto - igual estructura, con key={producto._id} */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">BUSCAR PRODUCTO - CREAR</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="md:col-span-2 relative">
                      <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={busquedaProducto}
                        onChange={(e) => setBusquedaProducto(e.target.value)}
                        onFocus={() => busquedaProducto && setMostrarResultadosProducto(true)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {mostrarResultadosProducto && productosFiltrados.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {productosFiltrados.map(producto => (
                            <div key={producto._id} onClick={() => seleccionarProducto(producto)} className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                              <div className="font-medium text-gray-800">{producto.nombre}</div>
                              <div className="text-sm text-gray-600">Código: {producto.codigo} - ${producto.costoUnitario} - Stock: {producto.stock}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {mostrarResultadosProducto && productosFiltrados.length === 0 && busquedaProducto && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                          <div className="px-4 py-3 text-gray-500 text-center">No se encontraron productos</div>
                        </div>
                      )}
                    </div>
                    <input type="number" placeholder="Cantidad" value={productoTemporal.cantidad} onChange={(e) => setProductoTemporal({...productoTemporal, cantidad: parseInt(e.target.value) || 0})} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="number" step="0.01" placeholder="Costo Unitario" value={productoTemporal.costoUnitario} onChange={(e) => setProductoTemporal({...productoTemporal, costoUnitario: parseFloat(e.target.value) || 0})} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  {productoTemporal.productoNombre && (
                    <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
                      <span className="text-sm text-blue-800">✅ Producto: <strong>{productoTemporal.productoNombre}</strong> {productoTemporal.costoUnitario > 0 && `- Costo: $${productoTemporal.costoUnitario}`}</span>
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <button onClick={agregarProductoACompra} disabled={!productoTemporal.productoId} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                      Agregar Producto
                    </button>
                    <button onClick={() => setShowProductoForm(!showProductoForm)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">+ Crear Producto</button>
                  </div>
                </div>

                {/* Form Nuevo Producto */}
                {showProductoForm && (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">Nuevo Producto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input placeholder="Nombre" value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <input placeholder="Código" value={nuevoProducto.codigo} onChange={(e) => setNuevoProducto({...nuevoProducto, codigo: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <input placeholder="Color" value={nuevoProducto.color} onChange={(e) => setNuevoProducto({...nuevoProducto, color: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <input placeholder="Categoría" value={nuevoProducto.categoria} onChange={(e) => setNuevoProducto({...nuevoProducto, categoria: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <input type="number" step="0.01" placeholder="Costo Unitario" value={nuevoProducto.costoUnitario} onChange={(e) => setNuevoProducto({...nuevoProducto, costoUnitario: parseFloat(e.target.value) || 0})} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <input type="number" step="0.01" placeholder="Precio Venta" value={nuevoProducto.precioVenta} onChange={(e) => setNuevoProducto({...nuevoProducto, precioVenta: parseFloat(e.target.value) || 0})} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <div className="md:col-span-2 flex space-x-4">
                        <button onClick={agregarProducto} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">Guardar</button>
                        <button onClick={() => setShowProductoForm(false)} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition">Cancelar</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabla Productos */}
                {compra.productos.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Productos en Compra</h3>
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border p-2">Nombre</th>
                          <th className="border p-2">Cantidad</th>
                          <th className="border p-2">Costo Unit.</th>
                          <th className="border p-2">Total</th>
                          <th className="border p-2">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compra.productos.map(item => (
                          <tr key={item.id}>
                            <td className="border p-2">{item.nombre}</td>
                            <td className="border p-2">{item.cantidad}</td>
                            <td className="border p-2">${item.costoUnitario.toLocaleString()}</td>
                            <td className="border p-2">${item.costoTotal.toLocaleString()}</td>
                            <td className="border p-2"><button onClick={() => eliminarProductoDeCompra(item.id)} className="text-red-600 hover:underline">Eliminar</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-4 text-right text-xl font-bold">Total: ${totalCompra.toLocaleString()}</div>
                  </div>
                )}

                {/* Métodos Pago */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Métodos de Pago</h3>
                  <div className="flex flex-wrap gap-4">
                    {metodosPago.map(metodo => (
                      <label key={metodo} className="flex items-center space-x-2">
                        <input type="checkbox" checked={compra.metodoPago.includes(metodo)} onChange={() => toggleMetodoPago(metodo)} className="rounded" />
                        <span>{metodo}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Anticipos */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Anticipos (Total: ${totalAnticipos.toLocaleString()})</h3>
                    <button onClick={() => setShowAnticipoForm(!showAnticipoForm)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                      {showAnticipoForm ? 'Cancelar' : '+ Agregar'}
                    </button>
                  </div>
                  {showAnticipoForm && (
                    <div className="p-4 bg-purple-50 rounded-lg mb-4">
                      <input type="number" step="0.01" placeholder="Monto" value={nuevoAnticipo.monto} onChange={(e) => setNuevoAnticipo({...nuevoAnticipo, monto: parseFloat(e.target.value) || 0})} className="px-4 py-2 border rounded mr-2" />
                      <select value={nuevoAnticipo.metodoPago} onChange={(e) => setNuevoAnticipo({...nuevoAnticipo, metodoPago: e.target.value})} className="px-4 py-2 border rounded mr-2">
                        <option>Transferencia</option>
                        <option>Efectivo</option>
                      </select>
                      <select value={nuevoAnticipo.banco} onChange={(e) => setNuevoAnticipo({...nuevoAnticipo, banco: e.target.value})} className="px-4 py-2 border rounded mr-2">
                        {bancos.map(b => <option key={b}>{b}</option>)}
                      </select>
                      <button onClick={agregarAnticipo} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Guardar</button>
                    </div>
                  )}
                  {compra.anticipos.length > 0 && (
                    <table className="w-full border-collapse border border-gray-300">
                      <thead><tr className="bg-gray-100"><th className="border p-2">Monto</th><th className="border p-2">Método</th><th className="border p-2">Banco</th><th className="border p-2">Acciones</th></tr></thead>
                      <tbody>
                        {compra.anticipos.map(a => (
                          <tr key={a._id || a.id}>
                            <td className="border p-2">${a.monto.toLocaleString()}</td>
                            <td className="border p-2">{a.metodoPago}</td>
                            <td className="border p-2">{a.banco}</td>
                            <td className="border p-2"><button onClick={() => eliminarAnticipo(a.id || a._id)} className="text-red-600 hover:underline">Eliminar</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {saldoPendiente > 0 && <div className="text-right text-lg font-bold text-red-600 mt-2">Saldo Pendiente: ${saldoPendiente.toLocaleString()}</div>}
                </div>

                <div className="flex justify-end">
                  <button onClick={confirmarCompra} className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 font-semibold transition">
                    Confirmar Compra
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reportes - con datos de DB */}
          {activeSection === 'reporteCompras' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-6">Reporte de Compras</h2>
              {comprasFiltradas.length > 0 ? (
                <ul className="space-y-2">
                  {comprasFiltradas.map(c => (
                    <li key={c._id} className="p-4 bg-gray-50 rounded">{c.numeroCompra} - {c.proveedor} - ${c.total} ({c.estado})</li>
                  ))}
                </ul>
              ) : (
                <p>No hay compras en DB.</p>
              )}
            </div>
          )}
          {activeSection === 'reporteProveedores' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-6">Reporte de Proveedores</h2>
              {proveedoresFiltradosR.length > 0 ? (
                <ul className="space-y-2">
                  {proveedoresFiltradosR.map(p => (
                    <li key={p._id} className="p-4 bg-gray-50 rounded">{p.nombre} - NIT: {p.nit} - {p.estado}</li>
                  ))}
                </ul>
              ) : (
                <p>No hay proveedores en DB.</p>
              )}
            </div>
          )}
          {activeSection === 'registrarAnticipos' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-6">Registrar Anticipos</h2>
              <p>Usa el formulario en compras o expande esta sección.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComprasPage;