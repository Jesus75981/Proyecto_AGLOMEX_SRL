import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminCatalogPage = ({ userRole }) => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    color: '',
    categoria: '',
    nuevaCategoria: '',
    marca: '',
    cajas: 0,
    ubicacion: '',
    tamano: '',
    codigo: '',
    precioVenta: '',
    imagen: '',
    alto: '',
    ancho: '',
    profundidad: '',
    metodoPago: 'Efectivo',
    proveedor: ''
  });

  const API_URL = 'http://localhost:5000/api/productos';

  // Cargar productos, categorías y proveedores
  useEffect(() => {
    fetchProductos();
    fetchCategorias();
    fetchProveedores();
  }, []);

  const fetchProductos = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Error al cargar productos');
      const data = await response.json();
      setProductos(data);
    } catch (err) {
      setError('Error al cargar productos: ' + err.message);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await fetch(`${API_URL}/categorias`);
      if (!response.ok) throw new Error('Error al cargar categorías');
      const data = await response.json();
      setCategorias(data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  const fetchProveedores = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/proveedores');
      if (!response.ok) throw new Error('Error al cargar proveedores');
      const data = await response.json();
      setProveedores(data);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoriaChange = (e) => {
    const value = e.target.value;
    if (value === 'nueva') {
      setFormData(prev => ({
        ...prev,
        categoria: 'nueva',
        nuevaCategoria: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        categoria: value,
        nuevaCategoria: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Usar nueva categoría si se especificó
      const categoriaFinal = formData.nuevaCategoria.trim() || formData.categoria;

      if (!categoriaFinal) {
        throw new Error('Debe seleccionar o crear una categoría');
      }

      const productoData = {
        ...formData,
        categoria: categoriaFinal,
        cajas: parseInt(formData.cajas) || 0,
        precioVenta: formData.precioVenta ? parseFloat(formData.precioVenta) : undefined,
        dimensiones: {
          alto: formData.alto ? parseFloat(formData.alto) : undefined,
          ancho: formData.ancho ? parseFloat(formData.ancho) : undefined,
          profundidad: formData.profundidad ? parseFloat(formData.profundidad) : undefined
        }
      };

      // Remover campos vacíos
      Object.keys(productoData).forEach(key => {
        if (productoData[key] === '' || productoData[key] === undefined) {
          delete productoData[key];
        }
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear producto');
      }

      const nuevoProducto = await response.json();
      setSuccess('Producto creado exitosamente');

      // Limpiar formulario
      setFormData({
        nombre: '',
        descripcion: '',
        color: '',
        categoria: '',
        nuevaCategoria: '',
        marca: '',
        cajas: 0,
        ubicacion: '',
        tamano: '',
        codigo: '',
        precioVenta: '',
        imagen: '',
        alto: '',
        ancho: '',
        profundidad: '',
        metodoPago: 'Efectivo',
        proveedor: ''
      });

      // Actualizar listas
      fetchProductos();
      fetchCategorias();
      setShowForm(false);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProductos = productos.filter(producto =>
    producto.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navigate = useNavigate();

  // ... existing code ...

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Administrar Catálogo</h1>
            <p>Módulo de administración de productos (Rol: {userRole})</p>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
          >
            <span>←</span> <span>Menú</span>
          </button>
        </div>

        {/* Mensajes de error y éxito */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Botón para mostrar/ocultar formulario */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {showForm ? 'Ocultar Formulario' : 'Crear Nuevo Producto'}
          </button>
        </div>

        {/* Formulario de creación */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-bold mb-4">Crear Nuevo Producto</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campos requeridos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleCategoriaChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="nueva">Crear nueva categoría</option>
                </select>
              </div>

              {formData.categoria === 'nueva' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Categoría *</label>
                  <input
                    type="text"
                    name="nuevaCategoria"
                    value={formData.nuevaCategoria}
                    onChange={handleInputChange}
                    placeholder="Ingrese nueva categoría"
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}

              {/* Campos opcionales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <input
                  type="text"
                  name="marca"
                  value={formData.marca}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cajas</label>
                <input
                  type="number"
                  name="cajas"
                  value={formData.cajas}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación en Almacén</label>
                <input
                  type="text"
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleInputChange}
                  placeholder="Ej: Estante A-5"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño</label>
                <input
                  type="text"
                  name="tamano"
                  value={formData.tamano}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta</label>
                <input
                  type="number"
                  name="precioVenta"
                  value={formData.precioVenta}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen URL</label>
                <input
                  type="url"
                  name="imagen"
                  value={formData.imagen}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Nuevos campos: Método de pago y Proveedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                <select
                  name="metodoPago"
                  value={formData.metodoPago}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credito">Crédito</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                <select
                  name="proveedor"
                  value={formData.proveedor}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Seleccionar proveedor</option>
                  {proveedores.map(prov => (
                    <option key={prov._id} value={prov._id}>{prov.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Dimensiones */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium mb-2">Dimensiones (cm)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alto</label>
                    <input
                      type="number"
                      name="alto"
                      value={formData.alto}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ancho</label>
                    <input
                      type="number"
                      name="ancho"
                      value={formData.ancho}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profundidad</label>
                    <input
                      type="number"
                      name="profundidad"
                      value={formData.profundidad}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Búsqueda y lista de productos */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Buscar Productos</h2>
          <input
            type="text"
            placeholder="Buscar por nombre o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md mb-4"
          />

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Categoría</th>
                  <th className="px-4 py-2 text-left">Color</th>
                  <th className="px-4 py-2 text-left">Cajas</th>
                  <th className="px-4 py-2 text-left">Ubicación</th>
                  <th className="px-4 py-2 text-left">Stock</th>
                  <th className="px-4 py-2 text-left">Precio Venta</th>
                  <th className="px-4 py-2 text-left">Estado Pago</th>
                </tr>
              </thead>
              <tbody>
                {filteredProductos.map(producto => (
                  <tr key={producto._id} className="border-t">
                    <td className="px-4 py-2">{producto.nombre}</td>
                    <td className="px-4 py-2">{producto.categoria}</td>
                    <td className="px-4 py-2">{producto.color}</td>
                    <td className="px-4 py-2">{producto.cajas || 0}</td>
                    <td className="px-4 py-2">{producto.ubicacion || 'N/A'}</td>
                    <td className="px-4 py-2">{producto.cantidad || 0}</td>
                    <td className="px-4 py-2">${producto.precioVenta ? producto.precioVenta.toFixed(2) : 'N/A'}</td>
                    <td className="px-4 py-2">
                      {producto.metodoPago === 'Credito' ? (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                          Falta Pagar
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          Pagado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProductos.length === 0 && (
              <p className="text-center py-4 text-gray-500">No se encontraron productos</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCatalogPage;
