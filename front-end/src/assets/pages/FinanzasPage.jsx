import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Función helper para hacer llamadas a la API
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

  // Allow absolute paths (starting with /api) or default to /api/finanzas
  const url = endpoint.startsWith('/api') ? endpoint : `/api/finanzas${endpoint}`;

  const response = await axios({
    url,
    ...config,
  });

  return response.data;
};

// Componente principal de la página de finanzas
const FinanzasPage = ({ userRole }) => {
  const navigate = useNavigate();
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

  // Estados para Cuentas por Pagar/Cobrar
  const [activeTab, setActiveTab] = useState('transacciones'); // 'transacciones', 'deudas', 'cuentas'
  const [activeSubTab, setActiveSubTab] = useState('todos'); // 'todos', 'ingreso', 'egreso' (para transacciones)
  const [activeDebtTab, setActiveDebtTab] = useState('pagar'); // 'pagar' (compras), 'cobrar' (ventas)

  const [deudasCompra, setDeudasCompra] = useState([]);
  const [deudasVenta, setDeudasVenta] = useState([]);

  const [showPagoDeudaForm, setShowPagoDeudaForm] = useState(false);
  const [selectedDeuda, setSelectedDeuda] = useState(null);
  const [pagoDeudaData, setPagoDeudaData] = useState({
    monto: '',
    tipoPago: 'Transferencia',
    cuenta: '',
    referencia: ''
  });

  // Estados para Cuentas Bancarias
  const [bankAccounts, setBankAccounts] = useState([]);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [accountFormData, setAccountFormData] = useState({
    nombreBanco: '',
    numeroCuenta: '',
    saldoInicial: ''
  });
  const [depositFormData, setDepositFormData] = useState({
    monto: '',
    descripcion: '',
    comprobanteUrl: '' // En un caso real, esto sería un archivo
  });

  // Estado para historial de cuenta
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [accountTransactions, setAccountTransactions] = useState([]);

  // Cargar transacciones al montar el componente
  useEffect(() => {
    loadTransactions();
    loadDeudas();
    loadBankAccounts();
    loadBankAccounts();
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

  const loadDeudas = async () => {
    try {
      const dataCompra = await apiFetch('/api/deudas');
      setDeudasCompra(dataCompra);

      const dataVenta = await apiFetch('/api/deudas/ventas');
      setDeudasVenta(dataVenta);
    } catch (err) {
      console.error('Error al cargar deudas:', err);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const data = await apiFetch('/cuentas');
      setBankAccounts(data);
    } catch (err) {
      console.error('Error al cargar cuentas bancarias:', err);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      if (editingAccountId) {
        // Modo Edición
        await apiFetch(`/cuentas/${editingAccountId}`, {
          method: 'PUT',
          data: accountFormData
        });
        alert('Cuenta actualizada exitosamente');
      } else {
        // Modo Creación
        await apiFetch('/cuentas', {
          method: 'POST',
          data: accountFormData
        });
        alert('Cuenta creada exitosamente');
      }

      setShowAccountForm(false);
      setEditingAccountId(null);
      setAccountFormData({ nombreBanco: '', numeroCuenta: '', saldoInicial: '' });
      loadBankAccounts();
    } catch (err) {
      console.error('Error al guardar cuenta:', err);
      alert('Error al guardar la cuenta');
    }
  };

  const handleEditAccount = (account) => {
    setEditingAccountId(account._id);
    setAccountFormData({
      nombreBanco: account.nombreBanco,
      numeroCuenta: account.numeroCuenta,
      saldoInicial: account.saldo // In edit mode, this might not be editable or used, but kept for consistency
    });
    setShowAccountForm(true);
  };


  // Estado para modal de transferencia al cerrar cuenta
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [accountToClose, setAccountToClose] = useState(null);
  const [targetAccountId, setTargetAccountId] = useState('');

  const handleUpdateAccountStatus = async (account) => {
    const newStatus = !account.isActive;

    // Si se va a activar, o si se va a desactivar pero no tiene saldo, proceder normal
    if (newStatus || account.saldo <= 0) {
      if (!confirm(`¿Estás seguro de que deseas ${newStatus ? 'activar' : 'dar de baja'} esta cuenta?`)) return;
      try {
        await apiFetch(`/cuentas/${account._id}`, {
          method: 'PUT',
          data: { isActive: newStatus }
        });
        loadBankAccounts();
      } catch (err) {
        console.error('Error al actualizar estado de cuenta:', err);
        alert('Error al actualizar el estado de la cuenta');
      }
    } else {
      // Si se va a desactivar y TIENE saldo, mostrar modal de transferencia
      setAccountToClose(account);
      setTargetAccountId(''); // Reset selection
      setShowTransferModal(true);
    }
  };

  const handleConfirmDeactivation = async (e) => {
    e.preventDefault();
    if (!accountToClose || !targetAccountId) return;

    try {
      await apiFetch(`/cuentas/${accountToClose._id}`, {
        method: 'PUT',
        data: {
          isActive: false,
          transferToAccountId: targetAccountId
        }
      });
      setShowTransferModal(false);
      setAccountToClose(null);
      loadBankAccounts();
      alert('Cuenta dada de baja y fondos transferidos exitosamente.');
    } catch (err) {
      console.error('Error al dar de baja cuenta con transferencia:', err);
      alert('Error al procesar la baja y transferencia.');
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;
    try {
      await apiFetch('/cuentas/deposito', {
        method: 'POST',
        data: {
          cuentaId: selectedAccount._id,
          ...depositFormData
        }
      });
      setShowDepositForm(false);
      setDepositFormData({ monto: '', descripcion: '', comprobanteUrl: '' });
      setSelectedAccount(null);
      loadBankAccounts();
      loadTransactions(); // Se genera un ingreso
      if (userRole === 'admin') loadSummary();
      alert('Depósito registrado exitosamente');
    } catch (err) {
      console.error('Error al registrar depósito:', err);
      alert('Error al registrar el depósito');
    }
  };

  const handleViewHistory = async (account) => {
    setSelectedAccount(account);
    try {
      const data = await apiFetch(`/cuentas/${account._id}/transacciones`);
      setAccountTransactions(data);
      setShowHistoryModal(true);
    } catch (err) {
      console.error('Error al cargar historial:', err);
      alert('Error al cargar el historial de la cuenta');
    }
  };

  const handlePagarDeudaClick = (deuda) => {
    setSelectedDeuda(deuda);
    setPagoDeudaData({
      monto: deuda.saldoActual, // Por defecto el total pendiente
      tipoPago: 'Transferencia',
      cuenta: '',
      referencia: ''
    });
    setShowPagoDeudaForm(true);
  };

  const handleConfirmarPagoDeuda = async (e) => {
    e.preventDefault();
    if (!selectedDeuda || !pagoDeudaData.monto) return;

    try {
      const endpoint = activeDebtTab === 'pagar'
        ? '/api/deudas/' + selectedDeuda._id + '/pagar'
        : '/api/deudas/' + selectedDeuda._id + '/cobrar';

      await apiFetch(endpoint, {
        method: 'POST',
        data: {
          monto: parseFloat(pagoDeudaData.monto),
          tipoPago: pagoDeudaData.tipoPago,
          referencia: pagoDeudaData.referencia,
          cuenta: pagoDeudaData.cuenta
          // deudaId is in URL, spread rest
        }
      });

      alert('Pago registrado exitosamente');
      setShowPagoDeudaForm(false);
      setSelectedDeuda(null);
      loadDeudas(); // Recargar deudas
      loadTransactions(); // Recargar transacciones (se generó un egreso)
      if (userRole === 'admin') loadSummary();
    } catch (err) {
      console.error('Error al pagar deuda:', err);
      alert('Error al registrar el pago: ' + (err.response?.data?.message || err.message));
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
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/home')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Volver al Menú
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
              >
                {showForm ? 'Cancelar' : '+ Nueva Transacción'}
              </button>
            </div>
          </div>


        </div>

        {/* Tabs de Navegación */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('transacciones')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'transacciones' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Transacciones
          </button>
          <button
            onClick={() => setActiveTab('deudas')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'deudas' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Cuentas por Pagar
          </button>
          <button
            onClick={() => setActiveTab('cuentas')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'cuentas' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Cuentas Bancarias
          </button>
        </div>

        {/* Contenido Principal */}
        {activeTab === 'transacciones' ? (
          <>
            {/* Sub-tabs Transacciones */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setActiveSubTab('todos')}
                className={`px-3 py-1 rounded-full text-sm ${activeSubTab === 'todos' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveSubTab('ingreso')}
                className={`px-3 py-1 rounded-full text-sm ${activeSubTab === 'ingreso' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Ingresos (Ventas)
              </button>
              <button
                onClick={() => setActiveSubTab('egreso')}
                className={`px-3 py-1 rounded-full text-sm ${activeSubTab === 'egreso' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Egresos (Compras)
              </button>
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
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors.amount ? 'border-red-500' : 'border-gray-300'
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
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors.description ? 'border-red-500' : 'border-gray-300'
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
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors.date ? 'border-red-500' : 'border-gray-300'
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuenta/Banco</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions
                        .filter(t => activeSubTab === 'todos' ? true : t.type === activeSubTab)
                        .map((transaction) => (
                          <tr key={transaction._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(transaction.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${transaction.type === 'ingreso'
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
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {transaction.metadata?.banco || transaction.metadata?.cuenta || '-'}
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
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Cuentas Pendientes</h2>

              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveDebtTab('pagar')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${activeDebtTab === 'pagar' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-600'}`}
                >
                  Por Pagar (Compras)
                </button>
                <button
                  onClick={() => setActiveDebtTab('cobrar')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${activeDebtTab === 'cobrar' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600'}`}
                >
                  Por Cobrar (Ventas)
                </button>
              </div>
            </div>

            {(activeDebtTab === 'pagar' ? deudasCompra : deudasVenta).length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 italic">No hay cuentas pendientes</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compra</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto Original</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pagado</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Pendiente</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(activeDebtTab === 'pagar' ? deudasCompra : deudasVenta).map((deuda) => (
                      <tr key={deuda._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {activeDebtTab === 'pagar' ? (deuda.proveedor?.nombre || 'N/A') : (deuda.cliente?.nombre || 'N/A')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {activeDebtTab === 'pagar' ? (deuda.compraId?.numCompra || 'N/A') : (deuda.ventaId?.numVenta || 'N/A')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(deuda.fechaCreacion)}</td>
                        <td className="px-6 py-4 text-sm text-right">{formatCurrency(deuda.montoOriginal || deuda.ventaId?.saldoPendiente + (deuda.montoPagado || 0))}</td>
                        {/* Note: montoOriginal might not exist in DeudaVenta depending on model, falling back logic might be needed or field standardized */}
                        <td className="px-6 py-4 text-sm text-right text-green-600">{formatCurrency(deuda.montoPagado)}</td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-red-600">{formatCurrency(deuda.saldoActual)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${deuda.estado === 'Pendiente' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {deuda.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handlePagarDeudaClick(deuda)}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm"
                          >
                            Pagar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
        }

        {
          activeTab === 'cuentas' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Cuentas Bancarias</h2>
                <button
                  onClick={() => setShowAccountForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  + Nueva Cuenta
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bankAccounts.map(account => (
                  <div key={account._id} className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${account.isActive ? 'border-green-500' : 'border-red-500'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{account.nombreBanco}</h3>
                        <p className="text-gray-500 text-sm">{account.numeroCuenta}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {account.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm text-gray-500">Saldo Disponible</p>
                      <p className="text-3xl font-bold text-gray-800">{formatCurrency(account.saldo)}</p>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedAccount(account);
                          setShowDepositForm(true);
                        }}
                        disabled={!account.isActive}
                        className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Depositar
                      </button>
                      <button
                        onClick={() => handleUpdateAccountStatus(account)}
                        className={`px-3 py-2 rounded-lg ${account.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {account.isActive ? 'Baja' : 'Alta'}
                      </button>
                      <button
                        onClick={() => handleEditAccount(account)}
                        className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        Editar
                      </button>
                    </div>
                    <button
                      onClick={() => handleViewHistory(account)}
                      className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      Ver Historial de Movimientos
                    </button>
                  </div>
                ))}
              </div>

              {/* Modal Nueva Cuenta */}
              {showAccountForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">{editingAccountId ? 'Editar Cuenta' : 'Nueva Cuenta Bancaria'}</h3>
                    <form onSubmit={handleCreateAccount} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Banco</label>
                        <input
                          type="text"
                          value={accountFormData.nombreBanco}
                          onChange={(e) => setAccountFormData({ ...accountFormData, nombreBanco: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cuenta</label>
                        <input
                          type="text"
                          value={accountFormData.numeroCuenta}
                          onChange={(e) => setAccountFormData({ ...accountFormData, numeroCuenta: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial</label>
                        <input
                          type="number"
                          step="0.01"
                          value={accountFormData.saldoInicial}
                          onChange={(e) => setAccountFormData({ ...accountFormData, saldoInicial: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          disabled={!!editingAccountId} // Disable saldo change during edit to avoid consistency issues
                        />
                      </div>
                      <div className="flex space-x-3 mt-6">
                        <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">{editingAccountId ? 'Guardar Cambios' : 'Crear Cuenta'}</button>
                        <button type="button" onClick={() => { setShowAccountForm(false); setEditingAccountId(null); setAccountFormData({ nombreBanco: '', numeroCuenta: '', saldoInicial: '' }); }} className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600">Cancelar</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Modal Depósito */}
              {showDepositForm && selectedAccount && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Realizar Depósito</h3>
                    <p className="text-sm text-gray-600 mb-4">Cuenta: <strong>{selectedAccount.nombreBanco} - {selectedAccount.numeroCuenta}</strong></p>
                    <form onSubmit={handleDepositSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto a Depositar</label>
                        <input
                          type="number"
                          step="0.01"
                          value={depositFormData.monto}
                          onChange={(e) => setDepositFormData({ ...depositFormData, monto: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <input
                          type="text"
                          value={depositFormData.descripcion}
                          onChange={(e) => setDepositFormData({ ...depositFormData, descripcion: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="Ej: Depósito de ventas del día"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Comprobante (URL/Imagen)</label>
                        {/* En un futuro, cambiar a input file y subir a servidor */}
                        <input
                          type="text"
                          value={depositFormData.comprobanteUrl}
                          onChange={(e) => setDepositFormData({ ...depositFormData, comprobanteUrl: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="URL del comprobante (opcional)"
                        />
                      </div>
                      <div className="flex space-x-3 mt-6">
                        <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Confirmar Depósito</button>
                        <button type="button" onClick={() => setShowDepositForm(false)} className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600">Cancelar</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Modal Transferencia por Cierre */}
              {showTransferModal && accountToClose && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Transferir Fondos y Cerrar</h3>
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        La cuenta <strong>{accountToClose.nombreBanco}</strong> tiene un saldo de <strong>{formatCurrency(accountToClose.saldo)}</strong>.
                        Para darla de baja, debes transferir estos fondos a otra cuenta activa.
                      </p>
                    </div>
                    <form onSubmit={handleConfirmDeactivation} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Destino</label>
                        <select
                          value={targetAccountId}
                          onChange={(e) => setTargetAccountId(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          required
                        >
                          <option value="">-- Seleccionar Cuenta --</option>
                          {bankAccounts
                            .filter(acc => acc.isActive && acc._id !== accountToClose._id)
                            .map(acc => (
                              <option key={acc._id} value={acc._id}>
                                {acc.nombreBanco} - {acc.numeroCuenta}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                      <div className="flex space-x-3 mt-6">
                        <button type="submit" className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">Transferir y Cerrar</button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowTransferModal(false);
                            setAccountToClose(null);
                          }}
                          className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Modal Historial */}
              {showHistoryModal && selectedAccount && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">Historial de Movimientos</h3>
                      <button onClick={() => setShowHistoryModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Cuenta: <strong>{selectedAccount.nombreBanco} - {selectedAccount.numeroCuenta}</strong></p>
                      <p className="text-sm text-gray-600">Saldo Actual: <strong>{formatCurrency(selectedAccount.saldo)}</strong></p>
                    </div>

                    <div className="overflow-y-auto flex-1">
                      {accountTransactions.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No hay movimientos registrados.</p>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {accountTransactions.map((tx) => (
                              <tr key={tx._id}>
                                <td className="px-4 py-2 text-sm text-gray-900">{new Date(tx.fecha).toLocaleDateString()}</td>
                                <td className="px-4 py-2 text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs ${tx.tipo === 'Depósito' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {tx.tipo}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">{tx.descripcion}</td>
                                <td className={`px-4 py-2 text-sm text-right font-medium ${tx.tipo === 'Depósito' ? 'text-green-600' : 'text-red-600'}`}>
                                  {tx.tipo === 'Depósito' ? '+' : '-'}{formatCurrency(tx.monto)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t flex justify-end">
                      <button
                        onClick={() => setShowHistoryModal(false)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        }

        {/* Modal de Pago de Deuda */}
        {
          showPagoDeudaForm && selectedDeuda && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Registrar Pago de Deuda</h3>
                <div className="mb-4 p-3 bg-gray-50 rounded border">
                  <p className="text-sm text-gray-600">Proveedor: <span className="font-semibold">{selectedDeuda.proveedor?.nombre}</span></p>
                  <p className="text-sm text-gray-600">Saldo Pendiente: <span className="font-bold text-red-600">{formatCurrency(selectedDeuda.saldoActual)}</span></p>
                </div>

                <form onSubmit={handleConfirmarPagoDeuda} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto a Pagar</label>
                    <input
                      type="number"
                      step="0.01"
                      max={selectedDeuda.saldoActual}
                      value={pagoDeudaData.monto}
                      onChange={(e) => setPagoDeudaData({ ...pagoDeudaData, monto: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                    <select
                      value={pagoDeudaData.tipoPago}
                      onChange={(e) => setPagoDeudaData({ ...pagoDeudaData, tipoPago: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  {(pagoDeudaData.tipoPago === 'Transferencia' || pagoDeudaData.tipoPago === 'Cheque') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {pagoDeudaData.tipoPago === 'Transferencia' ? 'Cuenta de Origen' : 'Banco Emisor'}
                      </label>
                      <select
                        value={pagoDeudaData.cuenta}
                        onChange={(e) => setPagoDeudaData({ ...pagoDeudaData, cuenta: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        required
                      >
                        <option value="">-- Seleccionar Cuenta --</option>
                        {bankAccounts
                          .filter(acc => acc.isActive)
                          .map(acc => (
                            <option key={acc._id} value={`${acc.nombreBanco} - ${acc.numeroCuenta}`}>
                              {acc.nombreBanco} ({acc.numeroCuenta}) - Saldo: {formatCurrency(acc.saldo)}
                            </option>
                          ))
                        }
                      </select>
                      {/* Fallback/Correction: The backend expects 'cuenta' string. 
                          If we want to link it to the actual bank account ID for automatic deduction, 
                          we should probably store the ID or handle it. 
                          
                          Looking at controller 'registrarPagoDeuda':
                          It expects 'cuenta' string. 
                          But 'registrarCompra' handled deductions automatically. 
                          
                          Wait, 'registrarPagoDeuda' in 'finanzas.controller.js' line 461 just takes 'cuenta' as string.
                          It does NOT seem to automatically deduct from BankAccount model unless we update it.
                          
                          Let's check 'finanzas.controller.js' again.
                          Ah, 'registrarPagoDeuda' (line 461) does NOT seem to update bank balance automatically 
                          like 'registrarCompra' does (lines 309-328 in compras.controller.js).
                          
                          However, the user request is just "display banks I have and let me select".
                          So binding the string value is what they asked for visual selection.
                          
                          If I pass the ID, the string in 'finanzas' collection will be an ID, which is ugly.
                          If I pass "BankName - AccountNum", it looks good in Finanzas history.
                          
                          But for accurate accounting, we should ideally deduct from the account...
                          But that's out of scope of "desplegar los bancos que tengo y me deje seleccionar".
                          I will stick to filling the string value for now as requested.
                      */}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Referencia (Opcional)</label>
                    <input
                      type="text"
                      value={pagoDeudaData.referencia}
                      onChange={(e) => setPagoDeudaData({ ...pagoDeudaData, referencia: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Ej: Recibo 123"
                    />
                  </div>
                  <div className="flex space-x-3 mt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    >
                      Confirmar Pago
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPagoDeudaForm(false)}
                      className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default FinanzasPage;
