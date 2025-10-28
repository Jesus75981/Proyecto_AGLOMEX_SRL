import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Función helper para hacer llamadas a la API
const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  const response = await axios({
    url: `/api/finanzas${endpoint}`,
    ...config,
  });

  return response.data;
};

// Componente principal de la página de finanzas
const FinanzasPage = ({ userRole }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'ingreso',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [editingId, setEditingId] = useState(null);
  const [summary, setSummary] = useState({ ingresos: 0, egresos: 0, balance: 0 });
  const [errors, setErrors] = useState({});

  // Cargar transacciones al montar el componente
  useEffect(() => {
    loadTransactions();
    if (userRole === 'admin') {
      loadSummary();
    }
  }, [userRole]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/');
      setTransactions(data);
    } catch (err) {
      setError('Error al cargar transacciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await apiFetch('/resumen');
      setSummary(data.data);
    } catch (err) {
      console.error('Error al cargar resumen:', err);
    }
  };

  const validarTransaccion = () => {
    const nuevosErrores = {};

    if (!formData.description.trim()) {
      nuevosErrores.description = 'La descripción es requerida';
    } else if (formData.description.trim().length < 3) {
      nuevosErrores.description = 'La descripción debe tener al menos 3 caracteres';
    }

    if (!formData.amount || formData.amount <= 0) {
      nuevosErrores.amount = 'El monto debe ser mayor a 0';
    } else if (formData.amount > 1000000) {
      nuevosErrores.amount = 'El monto no puede ser mayor a $1,000,000';
    }

    if (!formData.date) {
      nuevosErrores.date = 'La fecha es requerida';
    } else {
      const fechaSeleccionada = new Date(formData.date);
      const hoy = new Date();
      if (fechaSeleccionada > hoy) {
        nuevosErrores.date = 'La fecha no puede ser futura';
      }
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarTransaccion()) return;

    try {
      if (editingId) {
        await apiFetch(`/${editingId}`, {
          method: 'PUT',
          data: formData
        });
        setEditingId(null);
      } else {
        await apiFetch('/', {
          method: 'POST',
          data: formData
        });
      }
      setFormData({
        type: 'ingreso',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });
      setErrors({});
      setShowForm(false);
      loadTransactions();
      if (userRole === 'admin') loadSummary();
    } catch (err) {
      setError('Error al guardar la transacción');
      console.error(err);
    }
  };

  const handleEdit = (transaction) => {
    setFormData({
      type: transaction.type,
      description: transaction.description,
      amount: transaction.amount,
      date: new Date(transaction.date).toISOString().split('T')[0]
    });
    setEditingId(transaction._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta transacción?')) return;
    try {
      await apiFetch(`/${id}`, { method: 'DELETE' });
      loadTransactions();
      if (userRole === 'admin') loadSummary();
    } catch (err) {
      setError('Error al eliminar la transacción');
      console.error(err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-MX');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando finanzas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Finanzas</h1>
              <p className="text-gray-500 mt-2">Gestión de ingresos y egresos</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              {showForm ? 'Cancelar' : '+ Nueva Transacción'}
            </button>
          </div>

          {/* Resumen para admins */}
          {userRole === 'admin' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-800">Ingresos</h3>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.ingresos)}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="text-lg font-semibold text-red-800">Egresos</h3>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.egresos)}</p>
              </div>
              <div className={`p-4 rounded-lg border ${summary.balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
                <h3 className="text-lg font-semibold text-gray-800">Balance</h3>
                <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.balance)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Formulario */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Transacción' : 'Nueva Transacción'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                    required
                  />
                  {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Descripción de la transacción"
                  required
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.date ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      type: 'ingreso',
                      description: '',
                      amount: '',
                      date: new Date().toISOString().split('T')[0]
                    });
                  }}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de transacciones */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Transacciones</h2>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-400">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {transactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 italic">No hay transacciones registradas</p>
              <p className="text-gray-400 text-sm mt-2">Haz clic en "Nueva Transacción" para comenzar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === 'ingreso'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={transaction.type === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'ingreso' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(transaction._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanzasPage;
