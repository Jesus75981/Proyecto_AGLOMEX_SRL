import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ComprasPage = ({ userRole }) => {
  const navigate = useNavigate();

  // ✅ Volver al HOME
  const volverAlHome = () => {
    navigate('/home');
  };

  // Estados principales
  const [activeSection, setActiveSection] = useState('realizarCompra');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para búsquedas
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [mostrarResultadosProveedor, setMostrarResultadosProveedor] = useState(false);
  const [mostrarResultadosProducto, setMostrarResultadosProducto] = useState(false);

  // Estado para realizar compra
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

  // Estados para formularios
  const [showProveedorForm, setShowProveedorForm] = useState(false);
  const [showProductoForm, setShowProductoForm] = useState(false);
  const [showAnticipoForm, setShowAnticipoForm] = useState(false);

  // Datos de ejemplo
  const [proveedores, setProveedores] = useState([
    {
      id: 1,
      nombre: 'Muebles Premium SA',
      contacto: 'Juan Rodríguez - juan@mueblespremium.com',
      telefono: '+591 123-4567',
      direccion: 'Av. Industrial 123, Santa Cruz',
      nit: '123456789',
      estado: 'Activo'
    },
    {
      id: 2,
      nombre: 'Diseño Contemporáneo SL',
      contacto: 'María González - maria@disenocontemporaneo.com',
      telefono: '+591 234-5678',
      direccion: 'Calle Comercio 456, La Paz',
      nit: '987654321',
      estado: 'Activo'
    },
    {
      id: 3,
      nombre: 'Confort Hogar SA',
      contacto: 'Carlos Martínez - carlos@conforthogar.com',
      telefono: '+591 345-6789',
      direccion: 'Zona Industrial 789, Cochabamba',
      nit: '456789123',
      estado: 'Activo'
    }
  ]);

  const [productos, setProductos] = useState([
    {
      id: 1,
      nombre: 'Silla Ejecutiva Ergonomica',
      codigo: 'A-11',
      color: 'Negro',
      categoria: 'Sillas',
      costoUnitario: 120.00,
      precioVenta: 199.99,
      stock: 150
    },
    {
      id: 2,
      nombre: 'Mesa de Centro Moderna',
      codigo: 'A-23',
      color: 'Marrón',
      categoria: 'Mesas',
      costoUnitario: 85.50,
      precioVenta: 149.99,
      stock: 75
    },
    {
      id: 3,
      nombre: 'Sofá 3 Plazas Cuero',
      codigo: 'B-44',
      color: 'Beige',
      categoria: 'Sofás',
      costoUnitario: 450.00,
      precioVenta: 799.99,
      stock: 8
    },
    {
      id: 4,
      nombre: 'Estantería Moderna Roble',
      codigo: 'C-15',
      color: 'Natural',
      categoria: 'Estanterías',
      costoUnitario: 65.00,
      precioVenta: 119.99,
      stock: 0
    }
  ]);

  const [comprasRegistradas, setComprasRegistradas] = useState([
    {
      id: 1,
      numeroCompra: 'COMP-001',
      fecha: '2024-01-15',
      proveedor: 'Muebles Premium SA',
      numeroFactura: 'FAC-001-2024',
      total: 1250.50,
      metodoPago: ['Crédito'],
      estado: 'Completada'
    },
    {
      id: 2,
      numeroCompra: 'COMP-002',
      fecha: '2024-01-16',
      proveedor: 'Diseño Contemporáneo SL',
      numeroFactura: 'FAC-002-2024',
      total: 850.75,
      metodoPago: ['Efectivo', 'Transferencia'],
      estado: 'Completada'
    },
    {
      id: 3,
      numeroCompra: 'COMP-003',
      fecha: '2024-01-17',
      proveedor: 'Confort Hogar SA',
      numeroFactura: 'FAC-003-2024',
      total: 2100.00,
      metodoPago: ['Crédito'],
      estado: 'Pendiente'
    }
  ]);

  const [anticipos, setAnticipos] = useState([
    {
      id: 1,
      numeroCompra: 'COMP-003',
      proveedor: 'Confort Hogar SA',
      fecha: '2024-01-10',
      monto: 500.00,
      metodoPago: 'Transferencia',
      banco: 'Banco 01',
      estado: 'Aplicado'
    },
    {
      id: 2,
      numeroCompra: 'COMP-003',
      proveedor: 'Confort Hogar SA',
      fecha: '2024-01-12',
      monto: 300.00,
      metodoPago: 'Efectivo',
      banco: '',
      estado: 'Aplicado'
    }
  ]);

  // Formularios nuevos
  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    direccion: '',
    nit: '',
    estado: 'Activo'
  });

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    codigo: '',
    color: '',
    categoria: '',
    costoUnitario: 0,
    precioVenta: 0
  });

  const [nuevoAnticipo, setNuevoAnticipo] = useState({
    compraId: '',
    monto: 0,
    metodoPago: 'Transferencia',
    banco: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  // Producto temporal para la compra
  const [productoTemporal, setProductoTemporal] = useState({
    productoId: '',
    productoNombre: '',
    cantidad: 1,
    costoUnitario: 0
  });

  // Métodos de pago disponibles
  const metodosPago = ['Efectivo', 'Transferencia', 'Cheque', 'Crédito'];
  const bancos = ['Banco 01', 'Banco 02', 'Banco 03', 'Banco 04'];

  // Cálculos
  const totalCompra = compra.productos.reduce((total, item) => {
    return total + (item.cantidad * item.costoUnitario);
  }, 0);

  const totalAnticipos = compra.anticipos.reduce((total, anticipo) => total + anticipo.monto, 0);
  const saldoPendiente = totalCompra - totalAnticipos;

  // Efectos para búsquedas
  useEffect(() => {
    if (busquedaProveedor) {
      const filtrados = proveedores.filter(prov =>
        prov.nombre.toLowerCase().includes(busquedaProveedor.toLowerCase()) ||
        prov.nit.toLowerCase().includes(busquedaProveedor.toLowerCase())
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
      const filtrados = productos.filter(prod =>
        prod.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        prod.codigo.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        prod.categoria.toLowerCase().includes(busquedaProducto.toLowerCase())
      );
      setProductosFiltrados(filtrados);
      setMostrarResultadosProducto(true);
    } else {
      setProductosFiltrados([]);
      setMostrarResultadosProducto(false);
    }
  }, [busquedaProducto, productos]);

  // Funciones para proveedores
  const agregarProveedor = () => {
    if (!nuevoProveedor.nombre || !nuevoProveedor.nit) return;

    const proveedor = {
      id: proveedores.length + 1,
      ...nuevoProveedor
    };

    setProveedores([...proveedores, proveedor]);
    setNuevoProveedor({
      nombre: '',
      contacto: '',
      telefono: '',
      direccion: '',
      nit: '',
      estado: 'Activo'
    });
    setShowProveedorForm(false);
    
    // Seleccionar automáticamente el nuevo proveedor
    setCompra({
      ...compra,
      proveedorId: proveedor.id.toString(),
      proveedorNombre: proveedor.nombre
    });
    setBusquedaProveedor(proveedor.nombre);
    setMostrarResultadosProveedor(false);
  };

  const seleccionarProveedor = (proveedor) => {
    setCompra({
      ...compra,
      proveedorId: proveedor.id.toString(),
      proveedorNombre: proveedor.nombre
    });
    setBusquedaProveedor(proveedor.nombre);
    setMostrarResultadosProveedor(false);
  };

  // Funciones para productos
  const agregarProducto = () => {
    if (!nuevoProducto.nombre || !nuevoProducto.codigo) return;

    const producto = {
      id: productos.length + 1,
      ...nuevoProducto,
      stock: 0
    };

    setProductos([...productos, producto]);
    setNuevoProducto({
      nombre: '',
      codigo: '',
      color: '',
      categoria: '',
      costoUnitario: 0,
      precioVenta: 0
    });
    setShowProductoForm(false);
    
    // Seleccionar automáticamente el nuevo producto
    setProductoTemporal({
      productoId: producto.id.toString(),
      productoNombre: producto.nombre,
      cantidad: 1,
      costoUnitario: producto.costoUnitario
    });
    setBusquedaProducto(producto.nombre);
    setMostrarResultadosProducto(false);
  };

  const seleccionarProducto = (producto) => {
    setProductoTemporal({
      productoId: producto.id.toString(),
      productoNombre: producto.nombre,
      cantidad: 1,
      costoUnitario: producto.costoUnitario
    });
    setBusquedaProducto(producto.nombre);
    setMostrarResultadosProducto(false);
  };

  // Funciones para la compra
  const agregarProductoACompra = () => {
    if (!productoTemporal.productoId || !productoTemporal.cantidad) return;

    const productoSeleccionado = productos.find(p => p.id === parseInt(productoTemporal.productoId));
    if (!productoSeleccionado) return;

    const productoCompra = {
      id: compra.productos.length + 1,
      productoId: productoSeleccionado.id,
      nombre: productoSeleccionado.nombre,
      codigo: productoSeleccionado.codigo,
      color: productoSeleccionado.color,
      cantidad: productoTemporal.cantidad,
      costoUnitario: productoTemporal.costoUnitario || productoSeleccionado.costoUnitario,
      costoTotal: productoTemporal.cantidad * (productoTemporal.costoUnitario || productoSeleccionado.costoUnitario)
    };

    setCompra({
      ...compra,
      productos: [...compra.productos, productoCompra]
    });

    setProductoTemporal({
      productoId: '',
      productoNombre: '',
      cantidad: 1,
      costoUnitario: 0
    });
    setBusquedaProducto('');
  };

  const eliminarProductoDeCompra = (id) => {
    setCompra({
      ...compra,
      productos: compra.productos.filter(p => p.id !== id)
    });
  };

  const toggleMetodoPago = (metodo) => {
    const nuevosMetodos = compra.metodoPago.includes(metodo)
      ? compra.metodoPago.filter(m => m !== metodo)
      : [...compra.metodoPago, metodo];
    
    setCompra({ ...compra, metodoPago: nuevosMetodos });
  };

  // Funciones para anticipos
  const agregarAnticipo = () => {
    if (!nuevoAnticipo.monto) return;

    const anticipo = {
      id: compra.anticipos.length + 1,
      ...nuevoAnticipo,
      fecha: new Date().toISOString().split('T')[0]
    };

    setCompra({
      ...compra,
      anticipos: [...compra.anticipos, anticipo]
    });

    setNuevoAnticipo({
      compraId: '',
      monto: 0,
      metodoPago: 'Transferencia',
      banco: '',
      fecha: new Date().toISOString().split('T')[0]
    });
    setShowAnticipoForm(false);
  };

  const eliminarAnticipo = (id) => {
    setCompra({
      ...compra,
      anticipos: compra.anticipos.filter(a => a.id !== id)
    });
  };

  // Confirmar compra
  const confirmarCompra = () => {
    if (!compra.proveedorId || compra.productos.length === 0) {
      alert('Complete todos los campos requeridos');
      return;
    }

    const proveedor = proveedores.find(p => p.id === parseInt(compra.proveedorId));
    
    const nuevaCompra = {
      id: comprasRegistradas.length + 1,
      numeroCompra: compra.numeroCompra,
      fecha: compra.fecha,
      proveedor: proveedor.nombre,
      numeroFactura: compra.numeroFactura,
      observaciones: compra.observaciones,
      total: totalCompra,
      metodoPago: compra.metodoPago,
      anticipos: compra.anticipos,
      productos: compra.productos,
      estado: saldoPendiente > 0 ? 'Pendiente' : 'Completada'
    };

    setComprasRegistradas([...comprasRegistradas, nuevaCompra]);
    
    // Resetear formulario
    setCompra({
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
    
    setBusquedaProveedor('');
    setBusquedaProducto('');

    alert('Compra registrada exitosamente');
  };

  // Filtrar datos para reportes
  const comprasFiltradasReporte = comprasRegistradas.filter(compra =>
    compra.numeroCompra.toLowerCase().includes(searchTerm.toLowerCase()) ||
    compra.proveedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    compra.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const proveedoresFiltradosReporte = proveedores.filter(proveedor =>
    proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.nit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const anticiposFiltrados = anticipos.filter(anticipo =>
    anticipo.numeroCompra.toLowerCase().includes(searchTerm.toLowerCase()) ||
    anticipo.proveedor.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <span className="text-sm text-gray-600">Módulo de Compras</span>
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
            <h1 className="text-4xl font-bold text-purple-600 mb-2">Módulo de Compras</h1>
            <p className="text-gray-600 text-lg">Gestión de compras, proveedores y anticipos</p>
          </div>

          {/* Navegación del Módulo */}
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
                      activeSection === item.key
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Barra de Búsqueda para Reportes */}
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
                <div className="absolute left-3 top-2.5 text-gray-400">
                  🔍
                </div>
              </div>
            </div>
          )}

          {/* Contenido de Secciones */}
          {activeSection === 'realizarCompra' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Realizar Compra</h2>
                
                {/* Información Básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      FECHA
                    </label>
                    <input
                      type="date"
                      value={compra.fecha}
                      onChange={(e) => setCompra({...compra, fecha: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NUM DE COMPRA
                    </label>
                    <input
                      type="text"
                      value={compra.numeroCompra}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PROVEEDOR
                    </label>
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
                        
                        {/* Resultados de búsqueda de proveedores */}
                        {mostrarResultadosProveedor && proveedoresFiltrados.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {proveedoresFiltrados.map(proveedor => (
                              <div
                                key={proveedor.id}
                                onClick={() => seleccionarProveedor(proveedor)}
                                className="px-4 py-2 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-800">{proveedor.nombre}</div>
                                <div className="text-sm text-gray-600">NIT: {proveedor.nit} - {proveedor.contacto}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Mensaje cuando no hay resultados */}
                        {mostrarResultadosProveedor && proveedoresFiltrados.length === 0 && busquedaProveedor && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                            <div className="px-4 py-3 text-gray-500 text-center">
                              No se encontraron proveedores
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setShowProveedorForm(!showProveedorForm)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 whitespace-nowrap"
                      >
                        + Crear Proveedor
                      </button>
                    </div>
                    
                    {/* Mostrar proveedor seleccionado */}
                    {compra.proveedorNombre && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <span className="text-sm text-green-800">
                          ✅ Proveedor seleccionado: <strong>{compra.proveedorNombre}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OBSERVACIONES
                    </label>
                    <textarea
                      value={compra.observaciones}
                      onChange={(e) => setCompra({...compra, observaciones: e.target.value})}
                      placeholder="Ejemplo: El proveedor enviará la mercadería una vez se cancele el saldo."
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NUM DE FACTURA
                    </label>
                    <input
                      type="text"
                      value={compra.numeroFactura}
                      onChange={(e) => setCompra({...compra, numeroFactura: e.target.value})}
                      placeholder="Ingrese número de factura"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Formulario de Nuevo Proveedor */}
                {showProveedorForm && (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">Nuevo Proveedor</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Nombre del proveedor"
                        value={nuevoProveedor.nombre}
                        onChange={(e) => setNuevoProveedor({...nuevoProveedor, nombre: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="text"
                        placeholder="NIT"
                        value={nuevoProveedor.nit}
                        onChange={(e) => setNuevoProveedor({...nuevoProveedor, nit: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="text"
                        placeholder="Contacto"
                        value={nuevoProveedor.contacto}
                        onChange={(e) => setNuevoProveedor({...nuevoProveedor, contacto: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="text"
                        placeholder="Teléfono"
                        value={nuevoProveedor.telefono}
                        onChange={(e) => setNuevoProveedor({...nuevoProveedor, telefono: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="text"
                        placeholder="Dirección"
                        value={nuevoProveedor.direccion}
                        onChange={(e) => setNuevoProveedor({...nuevoProveedor, direccion: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-lg md:col-span-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <div className="md:col-span-2 flex space-x-4">
                        <button
                          onClick={agregarProveedor}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                        >
                          Guardar Proveedor
                        </button>
                        <button
                          onClick={() => setShowProveedorForm(false)}
                          className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buscar y Agregar Productos */}
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
                      
                      {/* Resultados de búsqueda de productos */}
                      {mostrarResultadosProducto && productosFiltrados.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {productosFiltrados.map(producto => (
                            <div
                              key={producto.id}
                              onClick={() => seleccionarProducto(producto)}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-800">{producto.nombre}</div>
                              <div className="text-sm text-gray-600">
                                Código: {producto.codigo} - ${producto.costoUnitario} - Stock: {producto.stock}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Mensaje cuando no hay resultados */}
                      {mostrarResultadosProducto && productosFiltrados.length === 0 && busquedaProducto && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                          <div className="px-4 py-3 text-gray-500 text-center">
                            No se encontraron productos
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <input
                      type="number"
                      placeholder="Cantidad"
                      value={productoTemporal.cantidad}
                      onChange={(e) => setProductoTemporal({...productoTemporal, cantidad: parseInt(e.target.value) || 0})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Costo Unitario"
                      value={productoTemporal.costoUnitario}
                      onChange={(e) => setProductoTemporal({...productoTemporal, costoUnitario: parseFloat(e.target.value) || 0})}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Mostrar producto seleccionado */}
                  {productoTemporal.productoNombre && (
                    <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
                      <span className="text-sm text-blue-800">
                        ✅ Producto seleccionado: <strong>{productoTemporal.productoNombre}</strong>
                        {productoTemporal.costoUnitario > 0 && ` - Costo: $${productoTemporal.costoUnitario}`}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={agregarProductoACompra}
                      disabled={!productoTemporal.productoId}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Agregar Producto
                    </button>
                    
                    <button
                      onClick={() => setShowProductoForm(!showProductoForm)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                    >
                      + Crear Nuevo Producto
                    </button>
                  </div>
                </div>

                {/* Formulario de Nuevo Producto */}
                {showProductoForm && (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-green-800 mb-4">Nuevo Producto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Nombre del producto"
                        value={nuevoProducto.nombre}
                        onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="text"
                        placeholder="Código"
                        value={nuevoProducto.codigo}
                        onChange={(e) => setNuevoProducto({...nuevoProducto, codigo: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="text"
                        placeholder="Color"
                        value={nuevoProducto.color}
                        onChange={(e) => setNuevoProducto({...nuevoProducto, color: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="text"
                        placeholder="Categoría"
                        value={nuevoProducto.categoria}
                        onChange={(e) => setNuevoProducto({...nuevoProducto, categoria: e.target.value})}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Costo Unitario"
                        value={nuevoProducto.costoUnitario}
                        onChange={(e) => setNuevoProducto({...nuevoProducto, costoUnitario: parseFloat(e.target.value) || 0})}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Precio Venta"
                        value={nuevoProducto.precioVenta}
                        onChange={(e) => setNuevoProducto({...nuevoProducto, precioVenta: parseFloat(e.target.value) || 0})}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <div className="md:col-span-2 flex space-x-4">
                        <button
                          onClick={agregarProducto}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                        >
                          Guardar Producto
                        </button>
                        <button
                          onClick={() => setShowProductoForm(false)}
                          className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* El resto del código permanece igual (tabla de productos, métodos de pago, anticipos, etc.) */}
                {/* ... */}

              </div>
            </div>
          )}

          {/* Las otras secciones (registrarAnticipos, reporteCompras, reporteProveedores) permanecen igual */}
          {/* ... */}

        </div>
      </div>
    </div>
  );
};

export default ComprasPage;