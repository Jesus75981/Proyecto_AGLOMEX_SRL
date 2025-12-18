import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const UsuariosPage = ({ userRole }) => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para modal create/edit
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    nombre: '',
    password: '',
    rol: 'empleado_stock'
  });

  const getAuthToken = () => localStorage.getItem('token');

  const apiFetch = async (endpoint, options = {}) => {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    
    if (response.status === 401) {
       navigate('/login');
       throw new Error('No autorizado');
    }
    
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || 'Error en la petición');
    }
    return response.json();
  };

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/usuarios');
      setUsuarios(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario?')) return;
    try {
      await apiFetch(`/usuarios/${id}`, { method: 'DELETE' });
      setUsuarios(usuarios.filter(u => u._id !== id));
      alert('Usuario eliminado');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      nombre: user.nombre,
      password: '', // Password vacía por defecto al editar
      rol: user.rol
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      nombre: '',
      password: '',
      rol: 'empleado_stock'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update
        const body = { ...formData };
        if (!body.password) delete body.password; // No enviar si está vacío

        await apiFetch(`/usuarios/${editingUser._id}`, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
        alert('Usuario actualizado');
      } else {
        // Create
        await apiFetch('/usuarios', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        alert('Usuario creado');
      }
      setShowModal(false);
      fetchUsuarios();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/home')} className="text-gray-500 hover:text-gray-700 font-bold text-xl">
                    ←
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
            </div>
            <button 
                onClick={handleCreate}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold shadow transition-colors"
            >
                + Nuevo Usuario
            </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

        <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-100 text-gray-600 uppercase text-sm font-semibold">
                    <tr>
                        <th className="px-6 py-3">Nombre</th>
                        <th className="px-6 py-3">Usuario</th>
                        <th className="px-6 py-3">Rol</th>
                        <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {usuarios.map(user => (
                        <tr key={user._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">{user.nombre}</td>
                            <td className="px-6 py-4 text-gray-600">{user.username}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                    ${user.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 
                                      user.rol === 'empleado_tienda' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}
                                `}>
                                    {user.rol}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                                <button 
                                    onClick={() => handleEdit(user)}
                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Editar
                                </button>
                                <button 
                                    onClick={() => handleDelete(user._id)}
                                    className="text-red-600 hover:text-red-800 font-medium"
                                >
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                    {usuarios.length === 0 && !loading && (
                        <tr><td colSpan="4" className="text-center py-8 text-gray-500">No hay usuarios registrados</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <h2 className="text-xl font-bold mb-4">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                            <input 
                                type="text" 
                                required
                                value={formData.nombre}
                                onChange={e => setFormData({...formData, nombre: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario (Username)</label>
                            <input 
                                type="text" 
                                required
                                value={formData.username}
                                onChange={e => setFormData({...formData, username: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {editingUser ? 'Nueva Contraseña (dejar en blanco para mantener)' : 'Contraseña'}
                            </label>
                            <input 
                                type="password" 
                                required={!editingUser}
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                            <select 
                                value={formData.rol}
                                onChange={e => setFormData({...formData, rol: e.target.value})}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                            >
                                <option value="admin">Administrador</option>
                                <option value="empleado_tienda">Vendedor (Tienda)</option>
                                <option value="empleado_stock">Almacenista (Stock)</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button 
                            type="button" 
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosPage;
