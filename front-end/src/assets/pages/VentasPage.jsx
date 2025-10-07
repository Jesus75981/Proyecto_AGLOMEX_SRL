import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VentasPage = ({ userRole }) => {
  const navigate = useNavigate();
  
  // ✅ CORREGIDO: Volver al HOME (menú principal)
  const volverAlHome = () => {
    navigate('/home');
  };

  // Estados para el módulo de ventas
  const [searchTerm, setSearchTerm] = useState('');
  const [ventas, setVentas] = useState([
    { 
      id: 1, 
      cliente: 'Juan Pérez', 
      producto: 'Silla Ejecutiva', 
      cantidad: 2, 
      precio: 150, 
      total: 300, 
      fecha: '2024-01-15', 
      estado: 'Completada',
      vendedor: 'admin' 
    },
    { 
      id: 2, 
      cliente: 'María García', 
      producto: 'Mesa de Centro', 
      cantidad: 1, 
      precio: 200, 
      total: 200, 
      fecha: '2024-01-14', 
      estado: 'Completada',
      vendedor: 'vendedor' 
    },
    { 
      id: 3, 
      cliente: 'Carlos López', 
      producto: 'Sofá 3 Plazas', 
      cantidad: 1, 
      precio: 500, 
      total: 500, 
      fecha: '2024-01-13', 
      estado: 'Pendiente',
      vendedor: 'admin' 
    },
  ]);

  const [nuevaVenta, setNuevaVenta] = useState({
    cliente: '',
    producto: '',
    cantidad: 1,
    precio: 0,
    fecha: new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);

  // Productos predefinidos con precios
  const productos = [
    { nombre: 'Silla Ejecutiva', precio: 150 },
    { nombre: 'Mesa de Centro', precio: 200 },
    { nombre: 'Sofá 3 Plazas', precio: 500 },
    { nombre: 'Estantería Moderna', precio: 300 },
    { nombre: 'Escritorio Oficina', precio: 250 },
    { nombre: 'Cama Queen Size', precio: 800 },
    { nombre: 'Ropero 3 Puertas', precio: 450 },
    { nombre: 'Mesa de Comedor', precio: 600 }
  ];

  // Función de búsqueda
  const ventasFiltradas = ventas.filter(venta =>
    venta.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.estado.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ VALIDACIONES COMPLETAS
  const validarVenta = () => {
    const nuevosErrores = {};

    if (!nuevaVenta.cliente.trim()) {
      nuevosErrores.cliente = 'El cliente es requerido';
    } else if (nuevaVenta.cliente.trim().length < 3) {
      nuevosErrores.cliente = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!nuevaVenta.producto.trim()) {
      nuevosErrores.producto = 'El producto es requerido';
    }

    if (nuevaVenta.cantidad <= 0) {
      nuevosErrores.cantidad = 'La cantidad debe ser mayor a 0';
    } else if (nuevaVenta.cantidad > 100) {
      nuevosErrores.cantidad = 'La cantidad no puede ser mayor a 100';
    }

    if (nuevaVenta.precio <= 0) {
      nuevosErrores.precio = 'El precio debe ser mayor a 0';
    } else if (nuevaVenta.precio > 10000) {
      nuevosErrores.precio = 'El precio no puede ser mayor a $10,000';
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

  // Actualizar precio cuando se selecciona producto
  const handleProductoChange = (productoNombre) => {
    const producto = productos.find(p => p.nombre === productoNombre);
    setNuevaVenta({
      ...nuevaVenta,
      producto: productoNombre,
      precio: producto ? producto.precio : 0
    });
  };

  // ✅ AGREGAR NUEVA VENTA
  const agregarVenta = () => {
    if (!validarVenta()) return;

    const venta = {
      id: ventas.length + 1,
      ...nuevaVenta,
      total: nuevaVenta.cantidad * nuevaVenta.precio,
      estado: 'Pendiente',
      vendedor: userRole || 'usuario'
    };

    setVentas([...ventas, venta]);
    setNuevaVenta({
      cliente: '',
      producto: '',
      cantidad: 1,
      precio: 0,
      fecha: new Date().toISOString().split('T')[0]
    });
    setErrors({});
    setShowForm(false);
    
    // Mostrar mensaje de éxito
    alert('✅ Venta registrada exitosamente');
  };

  // Cambiar estado de venta
  const cambiarEstadoVenta = (id, nuevoEstado) => {
    setVentas(ventas.map(venta => 
      venta.id === id ? { ...venta, estado: nuevoEstado } : venta
    ));
  };

  // Eliminar venta (solo admin)
  const eliminarVenta = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta venta?')) {
      setVentas(ventas.filter(venta => venta.id !== id));
      alert('🗑️ Venta eliminada correctamente');
    }
  };

  // Calcular totales
  const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0);
  const ventasCompletadas = ventas.filter(v => v.estado === 'Completada').length;
  const ventasPendientes = ventas.filter(v => v.estado === 'Pendiente').length;

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
              <span className="text-sm text-gray-600">Módulo de Ventas</span>
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
            <h1 className="text-4xl font-bold text-green-600 mb-2">Módulo de Ventas</h1>
            <p className="text-gray-600 text-lg">Gestión completa de ventas y clientes</p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Total Ventas</h3>
                  <p className="text-2xl font-bold text-gray-800">${totalVentas.toLocaleString()}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <span className="text-green-600 text-xl">💰</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Ventas Totales</h3>
                  <p className="text-2xl font-bold text-gray-800">{ventas.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <span className="text-blue-600 text-xl">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Completadas</h3>
                  <p className="text-2xl font-bold text-gray-800">{ventasCompletadas}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <span className="text-purple-600 text-xl">✅</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600">Pendientes</h3>
                  <p className="text-2xl font-bold text-gray-800">{ventasPendientes}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <span className="text-yellow-600 text-xl">⏳</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controles Superiores */}
          <div className="flex justify-between items-center mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por cliente, producto o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-80"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                🔍
              </div>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200 font-semibold"
            >
              {showForm ? 'Cancelar' : '+ Nueva Venta'}
            </button>
          </div>

          {/* Formulario de Nueva Venta */}
          {showForm && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Registrar Nueva Venta</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cliente *</label>
                  <input
                    type="text"
                    value={nuevaVenta.cliente}
                    onChange={(e) => setNuevaVenta({...nuevaVenta, cliente: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.cliente ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Nombre completo del cliente"
                  />
                  {errors.cliente && <p className="text-red-500 text-sm mt-1">{errors.cliente}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Producto *</label>
                  <select
                    value={nuevaVenta.producto}
                    onChange={(e) => handleProductoChange(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.producto ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar producto</option>
                    {productos.map((producto, index) => (
                      <option key={index} value={producto.nombre}>
                        {producto.nombre} - ${producto.precio}
                      </option>
                    ))}
                  </select>
                  {errors.producto && <p className="text-red-500 text-sm mt-1">{errors.producto}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={nuevaVenta.cantidad}
                    onChange={(e) => setNuevaVenta({...nuevaVenta, cantidad: parseInt(e.target.value) || 1})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.cantidad ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.cantidad && <p className="text-red-500 text-sm mt-1">{errors.cantidad}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Precio Unitario *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    max="10000"
                    value={nuevaVenta.precio}
                    onChange={(e) => setNuevaVenta({...nuevaVenta, precio: parseFloat(e.target.value) || 0})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.precio ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.precio && <p className="text-red-500 text-sm mt-1">{errors.precio}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha *</label>
                  <input
                    type="date"
                    value={nuevaVenta.fecha}
                    onChange={(e) => setNuevaVenta({...nuevaVenta, fecha: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.fecha ? 'border-red-500' : 'border-gray-300'
                    }`}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.fecha && <p className="text-red-500 text-sm mt-1">{errors.fecha}</p>}
                </div>

                <div className="flex items-end">
                  <div className="bg-gray-100 p-4 rounded-lg w-full">
                    <p className="text-sm text-gray-600">Total a pagar:</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${(nuevaVenta.cantidad * nuevaVenta.precio).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={agregarVenta}
                  className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition duration-200 font-semibold shadow-md"
                >
                  Registrar Venta
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setErrors({});
                  }}
                  className="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition duration-200 font-semibold"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de Ventas */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Historial de Ventas</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ventasFiltradas.map((venta) => (
                    <tr key={venta.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{venta.id}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {venta.cliente}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {venta.producto}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {venta.cantidad}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        ${venta.precio}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                        ${venta.total}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {venta.fecha}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          venta.estado === 'Completada' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {venta.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {venta.estado === 'Pendiente' && (
                            <button
                              onClick={() => cambiarEstadoVenta(venta.id, 'Completada')}
                              className="text-green-600 hover:text-green-900 text-xs"
                            >
                              Completar
                            </button>
                          )}
                          {userRole === 'admin' && (
                            <button
                              onClick={() => eliminarVenta(venta.id)}
                              className="text-red-600 hover:text-red-900 text-xs"
                            >
                              Eliminar
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
        </div>
      </div>
    </div>
  );
};

export default VentasPage;