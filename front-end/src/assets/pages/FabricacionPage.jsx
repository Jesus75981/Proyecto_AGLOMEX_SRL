import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FabricacionPage = ({ userRole }) => {
  const navigate = useNavigate();

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  // ✅ Volver al HOME (menú principal)
  const volverAlHome = () => {
    navigate('/home');
  };

  // Estados para el módulo de fabricación
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ordenes');
  const [showForm, setShowForm] = useState(false);

  // Estados de datos
  const [ordenesFabricacion, setOrdenesFabricacion] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para nueva orden
  const [nuevaOrden, setNuevaOrden] = useState({
    nombre: '',
    cantidad: 1,
    precioCompra: 0,
    precioVenta: 0,
    tiempoEstimado: 24,
    materiales: [],
    imagen: ''
  });

  // Estado para nuevo material (ahora usa ProductoTienda)
  const [nuevoMaterial, setNuevoMaterial] = useState({
    nombre: '',
    categoria: '',
    cantidad: 0,
    cantidadMinima: 10,
    precioCompra: 0,
    precioVenta: 0,
    unidad: '',
    ubicacion: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    await Promise.all([cargarOrdenes(), cargarMateriales(), cargarMaquinas()]);
    setLoading(false);
  };

  const cargarOrdenes = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/produccion');
      if (response.ok) {
        const data = await response.json();
        setOrdenesFabricacion(data);
      }
    } catch (error) {
      console.error('Error cargando órdenes:', error);
    }
  };

  const cargarMateriales = async () => {
    try {
      // Ahora filtramos por tipo 'Materia Prima' desde la API de productos
      const response = await fetch('http://localhost:5000/api/productos?tipo=Materia Prima');
      if (response.ok) {
        const data = await response.json();
        setMateriales(data);
      }
    } catch (error) {
      console.error('Error cargando materiales:', error);
    }
  };

  const cargarMaquinas = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/maquinas');
      if (response.ok) {
        const data = await response.json();
        setMaquinas(data);
      }
    } catch (error) {
      console.error('Error cargando máquinas:', error);
    }
  };

  // Filtrar datos según búsqueda
  const ordenesFiltradas = ordenesFabricacion.filter(orden =>
    orden.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    orden.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const materialesFiltrados = materiales.filter(mat =>
    mat.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mat.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maquinasFiltradas = maquinas.filter(maq =>
    maq.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    maq.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    maq.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funciones para órdenes de fabricación
  const agregarOrden = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/produccion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...nuevaOrden,
          idProduccion: `PROD-${Date.now()}` // Generar ID temporal si es necesario
        })
      });

      if (response.ok) {
        alert('✅ Orden creada exitosamente');
        setShowForm(false);
        cargarOrdenes();
        setNuevaOrden({
          nombre: '',
          cantidad: 1,
          precioCompra: 0,
          precioVenta: 0,
          tiempoEstimado: 24,
          materiales: [],
          imagen: ''
        });
      } else {
        alert('❌ Error al crear orden');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };

  const iniciarProduccionAutomatica = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/produccion/${id}/iniciar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert('✅ Producción iniciada. Materiales descontados.');
        cargarOrdenes();
        cargarMateriales(); // Recargar materiales para ver el descuento
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };

  const confirmarProduccion = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/produccion/${id}/confirmar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert('✅ Producción confirmada exitosamente');
        cargarOrdenes();
      } else {
        const errorData = await response.json();
        alert(`❌ Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };

  // Funciones para materiales (ahora productos)
  const agregarMaterial = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...nuevoMaterial,
          tipo: 'Materia Prima',
          color: 'N/A', // Valor por defecto
          codigo: `MAT-${Date.now()}` // Generar código automático
        })
      });

      if (response.ok) {
        alert('✅ Material agregado exitosamente');
        setShowForm(false);
        cargarMateriales();
        setNuevoMaterial({
          nombre: '',
          categoria: '',
          cantidad: 0,
          cantidadMinima: 10,
          precioCompra: 0,
          precioVenta: 0,
          unidad: '',
          ubicacion: ''
        });
      } else {
        alert('❌ Error al agregar material');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error de conexión');
    }
  };

  // Funciones para máquinas
  const cambiarEstadoMaquina = async (id, nuevoEstado) => {
    try {
      const response = await fetch(`http://localhost:5000/api/maquinas/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (response.ok) {
        cargarMaquinas();
      } else {
        alert('❌ Error al actualizar estado de máquina');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };


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

          {/* Pestañas */}
          <div className="bg-white rounded-xl shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {['ordenes', 'materiales', 'maquinas'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm capitalize ${activeTab === tab
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Producto *</label>
                      <input
                        type="text"
                        value={nuevaOrden.nombre}
                        onChange={(e) => setNuevaOrden({ ...nuevaOrden, nombre: e.target.value })}
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
                        onChange={(e) => setNuevaOrden({ ...nuevaOrden, cantidad: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Costo Estimado</label>
                      <input
                        type="number"
                        value={nuevaOrden.precioCompra}
                        onChange={(e) => setNuevaOrden({ ...nuevaOrden, precioCompra: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Precio Venta Estimado</label>
                      <input
                        type="number"
                        value={nuevaOrden.precioVenta}
                        onChange={(e) => setNuevaOrden({ ...nuevaOrden, precioVenta: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tiempo Estimado (horas)</label>
                      <input
                        type="number"
                        value={nuevaOrden.tiempoEstimado}
                        onChange={(e) => setNuevaOrden({ ...nuevaOrden, tiempoEstimado: parseInt(e.target.value) || 24 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Selección de Materiales (Simplificada por ahora) */}
                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Materiales Requeridos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {materiales.map(mat => (
                        <div key={mat._id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNuevaOrden({
                                  ...nuevaOrden,
                                  materiales: [...nuevaOrden.materiales, { material: mat._id, cantidad: 1 }]
                                });
                              } else {
                                setNuevaOrden({
                                  ...nuevaOrden,
                                  materiales: nuevaOrden.materiales.filter(m => m.material !== mat._id)
                                });
                              }
                            }}
                          />
                          <span>{mat.nombre} (Stock: {mat.cantidad})</span>
                          {nuevaOrden.materiales.find(m => m.material === mat._id) && (
                            <input
                              type="number"
                              className="w-20 border rounded px-1"
                              placeholder="Cant"
                              onChange={(e) => {
                                const updatedMaterials = nuevaOrden.materiales.map(m =>
                                  m.material === mat._id ? { ...m, cantidad: parseInt(e.target.value) || 1 } : m
                                );
                                setNuevaOrden({ ...nuevaOrden, materiales: updatedMaterials });
                              }}
                            />
                          )}
                        </div>
                      ))}
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
                {loading ? <p>Cargando...</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ordenesFiltradas.map((orden) => (
                          <tr key={orden._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-orange-600">
                              {orden.idProduccion}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {orden.nombre}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {orden.cantidad}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-orange-600 h-2.5 rounded-full"
                                  style={{ width: `${orden.progreso}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500 mt-1">{orden.progreso}%</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${orden.estado === 'Completado' ? 'bg-green-100 text-green-800' :
                                  orden.estado === 'En Progreso' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'}`}>
                                {orden.estado}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {orden.estado === 'Pendiente' && (
                                  <button
                                    onClick={() => iniciarProduccionAutomatica(orden._id)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Iniciar Producción"
                                  >
                                    ▶️
                                  </button>
                                )}
                                {orden.estado === 'En Progreso' && (
                                  <button
                                    onClick={() => confirmarProduccion(orden._id)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Confirmar Producción"
                                  >
                                    ✅
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
                        onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, nombre: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                      <input
                        type="text"
                        value={nuevoMaterial.categoria}
                        onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, categoria: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="ej. Maderas"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad Inicial</label>
                      <input
                        type="number"
                        value={nuevoMaterial.cantidad}
                        onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, cantidad: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Precio Compra</label>
                      <input
                        type="number"
                        value={nuevoMaterial.precioCompra}
                        onChange={(e) => setNuevoMaterial({ ...nuevoMaterial, precioCompra: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={agregarMaterial}
                      className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition duration-200 font-semibold"
                    >
                      Guardar Material
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

              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Inventario de Materiales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {materialesFiltrados.map((material) => (
                    <div key={material._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg text-gray-800">{material.nombre}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${material.cantidad > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {material.cantidad > 0 ? 'Disponible' : 'Agotado'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">{material.categoria}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Stock:</span>
                          <span className="font-medium">{material.cantidad}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Precio Compra:</span>
                          <span className="font-medium">${material.precioCompra}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'maquinas' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Estado de Maquinaria</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {maquinasFiltradas.map((maquina) => (
                    <div key={maquina._id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-800">{maquina.nombre}</h3>
                          <p className="text-sm text-gray-500">{maquina.tipo}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-3 py-1 text-xs rounded-full ${maquina.estado === 'Operativa' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {maquina.estado}
                          </span>
                          <select
                            value={maquina.estado}
                            onChange={(e) => cambiarEstadoMaquina(maquina._id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="Operativa">Operativa</option>
                            <option value="En mantenimiento">En mantenimiento</option>
                            <option value="Fuera de servicio">Fuera de servicio</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Último Mantenimiento</p>
                          <p className="font-medium">{new Date(maquina.ultimoMantenimiento).toLocaleDateString()}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500 mb-1">Eficiencia Operativa</p>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${maquina.eficiencia >= 90 ? 'bg-green-500' : maquina.eficiencia >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${maquina.eficiencia}%` }}
                            ></div>
                          </div>
                          <p className="text-right text-xs text-gray-500 mt-1">{maquina.eficiencia}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FabricacionPage;