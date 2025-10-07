import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FabricacionPage = ({ userRole }) => {
  const navigate = useNavigate();

  // ✅ CORREGIDO: Volver al HOME (menú principal)
  const volverAlHome = () => {
    navigate('/home');
  };

  // Estados para el módulo de fabricación
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ordenes');
  const [showForm, setShowForm] = useState(false);

  // Datos de ejemplo
  const [ordenesFabricacion, setOrdenesFabricacion] = useState([
    {
      id: 1,
      numero: 'OF-2024-001',
      producto: 'Sofá Modular Leda',
      cantidad: 5,
      fechaInicio: '2024-01-10',
      fechaFin: '2024-01-20',
      estado: 'En producción',
      prioridad: 'Alta',
      progreso: 75,
      materiales: ['Madera de Roble', 'Tela Terciopelo', 'Espuma'],
      responsable: 'Juan Pérez'
    },
    {
      id: 2,
      numero: 'OF-2024-002',
      producto: 'Mesa de Centro Orus',
      cantidad: 10,
      fechaInicio: '2024-01-12',
      fechaFin: '2024-01-18',
      estado: 'Completada',
      prioridad: 'Media',
      progreso: 100,
      materiales: ['Mármol Blanco', 'Metal Negro'],
      responsable: 'María García'
    },
    {
      id: 3,
      numero: 'OF-2024-003',
      producto: 'Silla Comedor Zephyr',
      cantidad: 20,
      fechaInicio: '2024-01-15',
      fechaFin: '2024-01-25',
      estado: 'Pendiente',
      prioridad: 'Baja',
      progreso: 0,
      materiales: ['Madera de Haya', 'Tela Gris'],
      responsable: 'Carlos López'
    },
    {
      id: 4,
      numero: 'OF-2024-004',
      producto: 'Estantería Charon',
      cantidad: 8,
      fechaInicio: '2024-01-08',
      fechaFin: '2024-01-15',
      estado: 'En ensamblaje',
      prioridad: 'Alta',
      progreso: 45,
      materiales: ['Madera de Pino', 'Tornillos'],
      responsable: 'Ana Rodríguez'
    }
  ]);

  const [materiales, setMateriales] = useState([
    {
      id: 1,
      nombre: 'Madera de Roble',
      categoria: 'Maderas',
      stockActual: 45,
      stockMinimo: 20,
      unidad: 'm²',
      estado: 'Disponible',
      ubicacion: 'Almacén A'
    },
    {
      id: 2,
      nombre: 'Tela Terciopelo',
      categoria: 'Textiles',
      stockActual: 120,
      stockMinimo: 50,
      unidad: 'm',
      estado: 'Disponible',
      ubicacion: 'Almacén B'
    },
    {
      id: 3,
      nombre: 'Espuma Alta Densidad',
      categoria: 'Espumas',
      stockActual: 8,
      stockMinimo: 25,
      unidad: 'kg',
      estado: 'Stock Bajo',
      ubicacion: 'Almacén C'
    },
    {
      id: 4,
      nombre: 'Tornillos de Acero',
      categoria: 'Herrajes',
      stockActual: 1500,
      stockMinimo: 500,
      unidad: 'unidad',
      estado: 'Disponible',
      ubicacion: 'Almacén D'
    }
  ]);

  const [maquinas, setMaquinas] = useState([
    {
      id: 1,
      nombre: 'Sierra Circular Industrial',
      tipo: 'Corte',
      estado: 'Operativa',
      ultimoMantenimiento: '2024-01-05',
      proximoMantenimiento: '2024-02-05',
      eficiencia: 95
    },
    {
      id: 2,
      nombre: 'Máquina de Coser Industrial',
      tipo: 'Tapicería',
      estado: 'En mantenimiento',
      ultimoMantenimiento: '2024-01-10',
      proximoMantenimiento: '2024-01-17',
      eficiencia: 85
    },
    {
      id: 3,
      nombre: 'Prensa Hidráulica',
      tipo: 'Moldeado',
      estado: 'Operativa',
      ultimoMantenimiento: '2024-01-08',
      proximoMantenimiento: '2024-02-08',
      eficiencia: 92
    },
    {
      id: 4,
      nombre: 'Lijadora Orbital',
      tipo: 'Acabado',
      estado: 'Operativa',
      ultimoMantenimiento: '2024-01-12',
      proximoMantenimiento: '2024-02-12',
      eficiencia: 88
    }
  ]);

  const [nuevaOrden, setNuevaOrden] = useState({
    producto: '',
    cantidad: 1,
    fechaInicio: '',
    fechaFin: '',
    prioridad: 'Media',
    materiales: [],
    responsable: ''
  });

  const [nuevoMaterial, setNuevoMaterial] = useState({
    nombre: '',
    categoria: '',
    stockActual: 0,
    stockMinimo: 10,
    unidad: '',
    ubicacion: ''
  });

  // Filtrar datos según búsqueda
  const ordenesFiltradas = ordenesFabricacion.filter(orden =>
    orden.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.responsable.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const materialesFiltrados = materiales.filter(mat =>
    mat.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mat.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mat.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maquinasFiltradas = maquinas.filter(maq =>
    maq.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    maq.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    maq.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funciones para órdenes de fabricación
  const cambiarEstadoOrden = (id, nuevoEstado) => {
    setOrdenesFabricacion(ordenesFabricacion.map(orden =>
      orden.id === id ? { 
        ...orden, 
        estado: nuevoEstado,
        progreso: nuevoEstado === 'Completada' ? 100 : 
                 nuevoEstado === 'En producción' ? 75 :
                 nuevoEstado === 'En ensamblaje' ? 45 :
                 nuevoEstado === 'Pendiente' ? 0 : orden.progreso
      } : orden
    ));
  };

  const actualizarProgreso = (id, nuevoProgreso) => {
    setOrdenesFabricacion(ordenesFabricacion.map(orden =>
      orden.id === id ? { 
        ...orden, 
        progreso: Math.min(100, Math.max(0, nuevoProgreso)),
        estado: nuevoProgreso >= 100 ? 'Completada' : 
               nuevoProgreso >= 75 ? 'En producción' :
               nuevoProgreso >= 45 ? 'En ensamblaje' : 'Pendiente'
      } : orden
    ));
  };

  const agregarOrden = () => {
    if (!nuevaOrden.producto || !nuevaOrden.responsable) return;

    const orden = {
      id: ordenesFabricacion.length + 1,
      numero: `OF-2024-${String(ordenesFabricacion.length + 1).padStart(3, '0')}`,
      ...nuevaOrden,
      estado: 'Pendiente',
      progreso: 0,
      fechaInicio: nuevaOrden.fechaInicio || new Date().toISOString().split('T')[0]
    };

    setOrdenesFabricacion([...ordenesFabricacion, orden]);
    setNuevaOrden({
      producto: '',
      cantidad: 1,
      fechaInicio: '',
      fechaFin: '',
      prioridad: 'Media',
      materiales: [],
      responsable: ''
    });
    setShowForm(false);
  };

  // Funciones para materiales
  const agregarMaterial = () => {
    if (!nuevoMaterial.nombre || !nuevoMaterial.categoria) return;

    const material = {
      id: materiales.length + 1,
      ...nuevoMaterial,
      estado: nuevoMaterial.stockActual <= nuevoMaterial.stockMinimo ? 'Stock Bajo' : 'Disponible'
    };

    setMateriales([...materiales, material]);
    setNuevoMaterial({
      nombre: '',
      categoria: '',
      stockActual: 0,
      stockMinimo: 10,
      unidad: '',
      ubicacion: ''
    });
  };

  // Funciones para máquinas
  const cambiarEstadoMaquina = (id, nuevoEstado) => {
    setMaquinas(maquinas.map(maquina =>
      maquina.id === id ? { 
        ...maquina, 
        estado: nuevoEstado,
        ultimoMantenimiento: nuevoEstado === 'En mantenimiento' ? new Date().toISOString().split('T')[0] : maquina.ultimoMantenimiento
      } : maquina
    ));
  };

  // Cálculos de métricas
  const totalOrdenes = ordenesFabricacion.length;
  const ordenesEnProduccion = ordenesFabricacion.filter(o => o.estado === 'En producción').length;
  const ordenesCompletadas = ordenesFabricacion.filter(o => o.estado === 'Completada').length;
  const promedioProgreso = ordenesFabricacion.reduce((sum, orden) => sum + orden.progreso, 0) / ordenesFabricacion.length;

  const materialesStockBajo = materiales.filter(m => m.estado === 'Stock Bajo').length;
  const maquinasOperativas = maquinas.filter(m => m.estado === 'Operativa').length;
  const eficienciaPromedio = maquinas.reduce((sum, maquina) => sum + maquina.eficiencia, 0) / maquinas.length;

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
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-orange-600 mb-2">Módulo de Fabricación</h1>
            <p className="text-gray-600 text-lg">Gestión de producción, materiales y equipos</p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Órdenes Activas</h3>
                  <p className="text-2xl font-bold text-gray-800">{totalOrdenes}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <span className="text-orange-600 text-xl">🏭</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">En Producción</h3>
                  <p className="text-2xl font-bold text-gray-800">{ordenesEnProduccion}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <span className="text-green-600 text-xl">⚙️</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Progreso Promedio</h3>
                  <p className="text-2xl font-bold text-gray-800">{promedioProgreso.toFixed(1)}%</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <span className="text-blue-600 text-xl">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Máquinas Activas</h3>
                  <p className="text-2xl font-bold text-gray-800">{maquinasOperativas}/{maquinas.length}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <span className="text-purple-600 text-xl">🔧</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pestañas */}
          <div className="bg-white rounded-xl shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {['ordenes', 'materiales', 'maquinas'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm capitalize ${
                      activeTab === tab
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
                onClick={() => setShowForm(!showForm)}
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
          </div>

          {/* Contenido de Pestañas */}
          {activeTab === 'ordenes' && (
            <div className="space-y-6">
              {/* Formulario de Nueva Orden */}
              {showForm && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Nueva Orden de Fabricación</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Producto *</label>
                      <input
                        type="text"
                        value={nuevaOrden.producto}
                        onChange={(e) => setNuevaOrden({...nuevaOrden, producto: e.target.value})}
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
                        onChange={(e) => setNuevaOrden({...nuevaOrden, cantidad: parseInt(e.target.value) || 1})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
                      <input
                        type="date"
                        value={nuevaOrden.fechaInicio}
                        onChange={(e) => setNuevaOrden({...nuevaOrden, fechaInicio: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin Estimada</label>
                      <input
                        type="date"
                        value={nuevaOrden.fechaFin}
                        onChange={(e) => setNuevaOrden({...nuevaOrden, fechaFin: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
                      <select
                        value={nuevaOrden.prioridad}
                        onChange={(e) => setNuevaOrden({...nuevaOrden, prioridad: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Responsable *</label>
                      <input
                        type="text"
                        value={nuevaOrden.responsable}
                        onChange={(e) => setNuevaOrden({...nuevaOrden, responsable: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Nombre del responsable"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={agregarOrden}
                      className="bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition duration-200 font-semibold"
                    >
                      Crear Orden de Fabricación
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden #</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ordenesFiltradas.map((orden) => (
                        <tr key={orden.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-orange-600">
                            {orden.numero}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {orden.producto}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {orden.cantidad}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                <div 
                                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${orden.progreso}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{orden.progreso}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              orden.estado === 'Completada' ? 'bg-green-100 text-green-800' :
                              orden.estado === 'En producción' ? 'bg-blue-100 text-blue-800' :
                              orden.estado === 'En ensamblaje' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {orden.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {orden.responsable}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {orden.estado !== 'Completada' && (
                                <>
                                  <button
                                    onClick={() => actualizarProgreso(orden.id, orden.progreso + 25)}
                                    className="text-green-600 hover:text-green-900 text-xs"
                                  >
                                    Avanzar
                                  </button>
                                  <button
                                    onClick={() => cambiarEstadoOrden(orden.id, 'Completada')}
                                    className="text-blue-600 hover:text-blue-900 text-xs"
                                  >
                                    Completar
                                  </button>
                                </>
                              )}
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
                        onChange={(e) => setNuevoMaterial({...nuevoMaterial, nombre: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Nombre del material"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                      <input
                        type="text"
                        value={nuevoMaterial.categoria}
                        onChange={(e) => setNuevoMaterial({...nuevoMaterial, categoria: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Categoría del material"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stock Actual</label>
                      <input
                        type="number"
                        min="0"
                        value={nuevoMaterial.stockActual}
                        onChange={(e) => setNuevoMaterial({...nuevoMaterial, stockActual: parseInt(e.target.value) || 0})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stock Mínimo</label>
                      <input
                        type="number"
                        min="0"
                        value={nuevoMaterial.stockMinimo}
                        onChange={(e) => setNuevoMaterial({...nuevoMaterial, stockMinimo: parseInt(e.target.value) || 10})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unidad</label>
                      <input
                        type="text"
                        value={nuevoMaterial.unidad}
                        onChange={(e) => setNuevoMaterial({...nuevoMaterial, unidad: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="kg, m, unidad, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
                      <input
                        type="text"
                        value={nuevoMaterial.ubicacion}
                        onChange={(e) => setNuevoMaterial({...nuevoMaterial, ubicacion: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Almacén, estante, etc."
                      />
                    </div>
                  </div>
                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={agregarMaterial}
                      className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition duration-200 font-semibold"
                    >
                      Agregar Material
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

              {/* Lista de Materiales */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Materiales de Fabricación</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {materialesFiltrados.map((material) => (
                        <tr key={material.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {material.nombre}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {material.categoria}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <span className={`font-semibold ${
                              material.stockActual <= material.stockMinimo ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {material.stockActual} {material.unidad}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">/ min: {material.stockMinimo}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {material.ubicacion}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              material.estado === 'Disponible' ? 'bg-green-100 text-green-800' :
                              material.estado === 'Stock Bajo' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {material.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'maquinas' && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Máquinas y Equipos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {maquinasFiltradas.map((maquina) => (
                  <div key={maquina.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800">{maquina.nombre}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        maquina.estado === 'Operativa' ? 'bg-green-100 text-green-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {maquina.estado}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>🔧 Tipo: {maquina.tipo}</p>
                      <p>📊 Eficiencia: {maquina.eficiencia}%</p>
                      <p>🛠️ Último mantenimiento: {maquina.ultimoMantenimiento}</p>
                      <p>📅 Próximo mantenimiento: {maquina.proximoMantenimiento}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex space-x-2">
                        {maquina.estado === 'Operativa' ? (
                          <button
                            onClick={() => cambiarEstadoMaquina(maquina.id, 'En mantenimiento')}
                            className="text-yellow-600 hover:text-yellow-900 text-xs"
                          >
                            Programar Mantenimiento
                          </button>
                        ) : (
                          <button
                            onClick={() => cambiarEstadoMaquina(maquina.id, 'Operativa')}
                            className="text-green-600 hover:text-green-900 text-xs"
                          >
                            Finalizar Mantenimiento
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FabricacionPage;