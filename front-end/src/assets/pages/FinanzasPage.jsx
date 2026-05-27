import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// --- Helper para API (Igual que DashboardPage) ---
import { API_URL, API_BASE_URL } from '../../config/api';

const getAuthToken = () => localStorage.getItem('token');

const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Handle absolute vs relative paths logic from previous implementation but safer
  const isGlobalApi = endpoint.startsWith('/api');
  const path = isGlobalApi ? endpoint.replace('/api', '') : `/finanzas${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  // NOTE: previous logic was: endpoint.startsWith('/api') ? endpoint : `/api/finanzas${endpoint}`
  // But DashboardPage uses base API_URL = .../api
  // So:
  // If endpoint is "/api/deudas", we want http://localhost:5000/api/deudas
  // If endpoint is "/resumen" (finanzas specific), we want http://localhost:5000/api/finanzas/resumen

  let fullUrl;
  if (endpoint.startsWith('/api')) {
    // e.g. /api/maquinas -> http://localhost:5000/api/maquinas
    fullUrl = `http://localhost:5000${endpoint}`;
  } else if (endpoint === '/') {
    // root of finanzas -> http://localhost:5000/api/finanzas/
    fullUrl = `${API_URL}/finanzas/`;
  } else {
    // e.g. /resumen -> http://localhost:5000/api/finanzas/resumen
    fullUrl = `${API_URL}/finanzas${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  }

  // Override for specific non-finanzas paths if passed as relative but intended for other modules?
  // The original code: const url = endpoint.startsWith('/api') ? endpoint : `/api/finanzas${endpoint}`;
  // So "/api/..." went to root, everything else to /api/finanzas/...

  // Simplification to match original logic exactly but using fetch:
  const urlToFetch = endpoint.startsWith('/api')
    ? `${API_BASE_URL}${endpoint}`
    : `${API_URL}/finanzas${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const response = await fetch(urlToFetch, { ...options, headers });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Sesión expirada o permisos insuficientes.');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Error en la petición a la API');
  }
  return response.json();
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
    category: 'ingreso_manual', // Default category
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    cuentaId: ''
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
    saldoInicial: '',
    tipo: 'banco' // Added default
  });
  const [depositFormData, setDepositFormData] = useState({
    monto: '',
    descripcion: '',
    comprobanteUrl: '' // En un caso real, esto sería un archivo
  });

  // Estado para historial de cuenta
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [accountTransactions, setAccountTransactions] = useState([]);

  // Estados para Maquinaria
  const [maquinarias, setMaquinarias] = useState([]);
  const [showMaquinaForm, setShowMaquinaForm] = useState(false);
  const [maquinaFormData, setMaquinaFormData] = useState({
    nombre: '',
    tipo: '',
    estado: 'Operativa',
    cantidad: 1,
    costo: ''
  });
  const [expandedMaquina, setExpandedMaquina] = useState(null);
  const [showMantenimientoForm, setShowMantenimientoForm] = useState(false);
  const [mantenimientoFormData, setMantenimientoFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    costo: '',
    descripcion: ''
  });

  // Filtros Transacciones
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [fiscalMetrics, setFiscalMetrics] = useState(null); // New state for fiscal summary

  // Cargar transacciones al montar el componente
  useEffect(() => {
    loadTransactions();
    loadDeudas();
    loadBankAccounts();
    loadMaquinas();
  }, [userRole]);

  useEffect(() => {
    if (activeTab === 'transacciones') {
      loadFiscalMetrics();
    }
  }, [activeTab, filterStartDate, filterEndDate]);

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
          body: JSON.stringify(accountFormData)
        });
        alert('Cuenta actualizada exitosamente');
      } else {
        // Modo Creación
        await apiFetch('/cuentas', {
          method: 'POST',
          body: JSON.stringify(accountFormData)
        });
        alert('Cuenta creada exitosamente');
      }

      setShowAccountForm(false);
      setEditingAccountId(null);
      setAccountFormData({ nombreBanco: '', numeroCuenta: '', saldoInicial: '', tipo: 'banco' });
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

  // Estado para Transferencia Interna de Fondos (Nueva Funcionalidad)
  const [showInternalTransferModal, setShowInternalTransferModal] = useState(false);
  const [transferFormData, setTransferFormData] = useState({
    sourceAccountId: '',
    targetAccountId: '',
    amount: '',
    description: ''
  });

  const handleInternalTransfer = async (e) => {
    e.preventDefault();
    try {
      if (transferFormData.sourceAccountId === transferFormData.targetAccountId) {
        alert("La cuenta de origen y destino no pueden ser la misma.");
        return;
      }
      await apiFetch('/cuentas/transferir', {
        method: 'POST',
        body: JSON.stringify(transferFormData)
      });

      setShowInternalTransferModal(false);
      setTransferFormData({ sourceAccountId: '', targetAccountId: '', amount: '', description: '' });
      loadBankAccounts();
      loadTransactions();
      // Si es admin, actualizar resumen global también
      if (userRole === 'admin') loadSummary();

      alert('Transferencia realizada con éxito.');
    } catch (err) {
      console.error(err);
      alert('Error en transferencia: ' + err.message);
    }
  };

  const handleUpdateAccountStatus = async (account) => {
    const newStatus = !account.isActive;

    // Si se va a activar, o si se va a desactivar pero no tiene saldo, proceder normal
    if (newStatus || account.saldo <= 0) {
      if (!confirm(`¿Estás seguro de que deseas ${newStatus ? 'activar' : 'dar de baja'} esta cuenta?`)) return;
      try {
        await apiFetch(`/cuentas/${account._id}`, {
          method: 'PUT',
          body: JSON.stringify({ isActive: newStatus })
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
        body: JSON.stringify({
          isActive: false,
          transferToAccountId: targetAccountId
        })
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
        body: JSON.stringify({
          cuentaId: selectedAccount._id,
          ...depositFormData,
          descripcion: depositFormData.descripcion || 'Depósito manual'
        })
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
        body: JSON.stringify({
          monto: parseFloat(pagoDeudaData.monto),
          tipoPago: pagoDeudaData.tipoPago,
          referencia: pagoDeudaData.referencia,
          cuenta: pagoDeudaData.cuenta
          // deudaId is in URL, spread rest
        })
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

    if (!formData.cuentaId) {
      nuevosErrores.cuentaId = 'Debe seleccionar una cuenta o caja de destino/origen';
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
          body: JSON.stringify(formData)
        });
        setEditingId(null);
      } else {
        await apiFetch('/', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setFormData({
        type: 'ingreso',
        category: 'ingreso_manual',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        cuentaId: ''
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
      category: transaction.category || (transaction.type === 'ingreso' ? 'ingreso_manual' : 'egreso_manual'),
      description: transaction.description,
      amount: transaction.amount,
      date: new Date(transaction.date).toISOString().split('T')[0],
      cuentaId: transaction.metadata?.cuentaId || ''
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



  // --- Funciones Maquinaria ---
  const loadMaquinas = async () => {
    try {
      const data = await apiFetch('/api/maquinas');
      setMaquinarias(data);
    } catch (err) {
      console.error('Error al cargar maquinarias:', err);
    }
  };

  const handleCreateMaquina = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/maquinas', {
        method: 'POST',
        body: JSON.stringify({
          ...maquinaFormData,
          costo: parseFloat(maquinaFormData.costo)
        })
      });
      setShowMaquinaForm(false);
      setMaquinaFormData({ nombre: '', tipo: '', estado: 'Operativa', costo: '' });
      loadMaquinas();
      alert('Maquinaria registrada exitosamente');
    } catch (err) {
      console.error('Error al registrar maquinaria:', err);
      alert('Error al registrar maquinaria');
    }
  };

  const handleDeleteMaquina = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta maquinaria?')) return;
    try {
      await apiFetch(`/api/maquinas/${id}`, { method: 'DELETE' });
      loadMaquinas();
    } catch (err) {
      console.error('Error al eliminar maquinaria:', err);
      alert('Error al eliminar');
    }
  };

  const loadFiscalMetrics = async () => {
    try {
      const queryParams = new URLSearchParams();
      // If filters are set, use them. If not, maybe default to current month or year?
      // For decision making, "All Time" might be heavy. Let's default to Year if no dates.
      if (filterStartDate) queryParams.append('startDate', filterStartDate);
      if (filterEndDate) queryParams.append('endDate', filterEndDate);
      // If no start/end provided, backend defaults to Year.

      const data = await apiFetch(`/estadisticas?${queryParams.toString()}`);
      if (data && data.metrics && data.metrics.resumenFiscal) {
        setFiscalMetrics(data.metrics.resumenFiscal);
      }
    } catch (err) {
      console.error('Error al cargar métricas fiscales:', err);
    }
  };

  const handleRegistrarMantenimiento = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/maquinas/${expandedMaquina}/mantenimiento`, {
        method: 'POST',
        body: JSON.stringify({
          ...mantenimientoFormData,
          costo: parseFloat(mantenimientoFormData.costo)
        })
      });
      setShowMantenimientoForm(false);
      setMantenimientoFormData({ fecha: new Date().toISOString().split('T')[0], costo: '', descripcion: '' });
      loadMaquinas(); // reload to update status/history
      alert('Mantenimiento registrado');
    } catch (err) {
      console.error(err);
      alert('Error al registrar mantenimiento');
    }
  };

  const exportarMaquinasPDF = () => {
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString();

    // Encabezado
    doc.setFontSize(18);
    doc.setTextColor(128, 0, 128); // Morado
    doc.text('Inventario de Maquinaria y Equipos', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de Reporte: ${fecha}`, 14, 28);
    doc.text('AGLOMEX SRL - Sistema de Gestión', 14, 33);

    const tableColumn = ["Nombre", "Tipo", "Cant.", "Estado", "Costo Unit.", "Subtotal"];
    const tableRows = [];

    maquinarias.forEach(m => {
      const maquinaData = [
        m.nombre,
        m.tipo,
        m.cantidad || 1,
        m.estado,
        `Bs. ${(m.costo || 0).toFixed(2)}`,
        `Bs. ${((m.costo || 0) * (m.cantidad || 1)).toFixed(2)}`
      ];
      tableRows.push(maquinaData);
    });

    const totalValor = maquinarias.reduce((acc, m) => acc + ((m.costo || 0) * (m.cantidad || 1)), 0);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [128, 0, 128] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 40 },
      didDrawPage: (data) => {
        if (data.pageNumber === doc.getNumberOfPages()) {
          const finalY = data.cursor.y + 10;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`VALOR TOTAL: Bs. ${totalValor.toFixed(2)}`, 140, finalY);
        }
      }
    });

    doc.save(`Inventario_Maquinaria_${fecha.replace(/\//g, '-')}.pdf`);
  };

  const exportarCuentasPDF = () => {
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.setTextColor(0, 100, 0); // Verde oscuro
    doc.text('Reporte de Cuentas y Cajas', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha: ${fecha}`, 14, 28);
    doc.text('AGLOMEX SRL - Gestión Financiera', 14, 33);

    const tableColumn = ["Entidad / Banco", "Nº Cuenta", "Tipo", "Estado", "Saldo"];
    const tableRows = [];

    bankAccounts.forEach(a => {
      tableRows.push([
        a.nombreBanco,
        a.numeroCuenta || 'N/A',
        a.tipo === 'efectivo' ? 'Caja/Efectivo' : 'Cuenta Bancaria',
        a.isActive ? 'Activa' : 'Inactiva',
        `Bs. ${(a.saldo || 0).toFixed(2)}`
      ]);
    });

    const totalSaldo = bankAccounts.filter(a => a.isActive).reduce((sum, a) => sum + a.saldo, 0);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [0, 128, 0] },
      margin: { top: 40 },
      didDrawPage: (data) => {
        if (data.pageNumber === doc.getNumberOfPages()) {
          const finalY = data.cursor.y + 10;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`CAPITAL TOTAL: Bs. ${totalSaldo.toFixed(2)}`, 140, finalY);
        }
      }
    });

    doc.save(`Reporte_Cuentas_${fecha.replace(/\//g, '-')}.pdf`);
  };

  const exportarTransaccionesPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Horizontal
    const fecha = new Date().toLocaleDateString();

    const filtered = transactions.filter(t => {
      // Logic for new 'inversion' tab and modified 'egreso' tab
      if (activeSubTab === 'ingreso' && t.type !== 'ingreso') return false;
      
      if (activeSubTab === 'egreso') {
        if (t.type !== 'egreso') return false;
        // Exclude investments from expenses
        if (t.category === 'compra_materias' || t.category === 'compra_productos') return false;
      }
      
      if (activeSubTab === 'inversion') {
        if (t.type !== 'egreso') return false;
        // Include only investments
        if (t.category !== 'compra_materias' && t.category !== 'compra_productos') return false;
      }

      const tDate = new Date(t.date);
      if (filterStartDate && tDate < new Date(filterStartDate)) return false;
      if (filterEndDate && tDate > new Date(filterEndDate)) return false;
      if (filterMinAmount && t.amount < parseFloat(filterMinAmount)) return false;
      if (filterMaxAmount && t.amount > parseFloat(filterMaxAmount)) return false;
      if (userRole === 'Tienda' || userRole === 'tienda' || userRole === 'empleado_tienda') {
        if (t.type === 'egreso' && t.category !== 'gasto_operativo') return false;
      }
      return true;
    });

    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102); // Azul oscuro
    doc.text('Historial de Transacciones Financieras', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Filtrado por: ${activeSubTab.toUpperCase()} | Fecha: ${fecha}`, 14, 28);
    doc.text('AGLOMEX SRL - Movimientos de Caja', 14, 33);

    const tableColumn = ["Fecha", "Tipo", "Categoría / Descripción", "Monto", "Cuenta Destino"];
    const tableRows = [];

    filtered.forEach(t => {
      let tipoLabel = t.type === 'ingreso' ? 'Ingreso' : 'Egreso';
      if (t.type === 'egreso' && (t.category === 'compra_materias' || t.category === 'compra_productos')) {
        tipoLabel = 'Inversión';
      }

      tableRows.push([
        new Date(t.date).toLocaleDateString(),
        tipoLabel,
        `${t.category ? t.category.replace(/_/g, ' ') : ''} - ${t.description}`,
        `${t.type === 'ingreso' ? '+' : '-'}${t.amount.toFixed(2)}`,
        t.metadata?.banco || t.metadata?.cuenta || 
        (t.metadata?.metodosPago && t.metadata.metodosPago.length > 0
          ? t.metadata.metodosPago.map(p => {
              const acc = bankAccounts.find(a => a._id === p.cuentaId);
              return acc ? `${acc.nombreBanco} (${acc.tipo === 'efectivo' ? 'Caja' : acc.numeroCuenta})` : p.tipo;
            }).join(' / ')
          : '-')
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102] },
      margin: { top: 40 },
      styles: { fontSize: 9 }
    });

    doc.save(`Transacciones_${fecha.replace(/\//g, '-')}.pdf`);
  };

  const getCategoryIcon = (categoryOrDesc) => {
    const d = categoryOrDesc.toLowerCase();

    // Categorías específicas
    if (d === 'otros_ingresos') return '💵';
    if (d === 'gastos_fijos') return '🏢';
    if (d === 'gastos_variables') return '📉';
    if (d === 'salida_caja_deposito') return '🏦';
    if (d === 'gasto_operativo') return '⚙️';
    if (d === 'costo_envio') return '🚚';
    if (d === 'pago_deuda_compra') return '🤝';
    if (d === 'cobro_venta') return '💳';

    // Fallback por descripción
    if (d.includes('compra') || d.includes('material')) return '🛒';
    if (d.includes('servicio') || d.includes('luz') || d.includes('agua')) return '💡';
    if (d.includes('mantenimiento') || d.includes('reparacion')) return '🛠️';
    if (d.includes('venta') || d.includes('ingreso')) return '💰';
    if (d.includes('transporte') || d.includes('flete')) return '🚚';
    if (d.includes('pago') || d.includes('sueldo')) return '💸';
    return '📄';
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
                className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <span>←</span> <span>Menú</span>
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

          {(userRole === 'admin' || userRole === 'dueno') && (
            <>
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
              <button
                onClick={() => setActiveTab('maquinaria')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'maquinaria' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Maquinaria
              </button>
            </>
          )}
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
                Egresos (Gastos)
              </button>
              <button
                onClick={() => setActiveSubTab('inversion')}
                className={`px-3 py-1 rounded-full text-sm ${activeSubTab === 'inversion' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Inversiones (Compras)
              </button>
            </div>



            {/* --- Resumen Fiscal para Toma de Decisiones (Solo Admin) --- */}
            {(userRole === 'admin' || userRole === 'dueno') && fiscalMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
                  <p className="text-sm text-gray-500 mb-1">Ventas Facturadas (Oficial)</p>
                  <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(fiscalMetrics.facturado || 0)}</h3>
                  <p className="text-xs text-blue-500 mt-1">Con Factura</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-500">
                  <p className="text-sm text-gray-500 mb-1">Ventas con Recibo (Interno)</p>
                  <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(fiscalMetrics.recibo || 0)}</h3>
                  <p className="text-xs text-orange-500 mt-1">Sin Factura</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-500">
                  <p className="text-sm text-gray-500 mb-1">Total Ventas (Periodo)</p>
                  <h3 className="text-2xl font-bold text-gray-800">{formatCurrency((fiscalMetrics.facturado || 0) + (fiscalMetrics.recibo || 0))}</h3>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${((fiscalMetrics.facturado || 0) / ((fiscalMetrics.facturado || 0) + (fiscalMetrics.recibo || 0) || 1)) * 100}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {((fiscalMetrics.facturado || 0) / ((fiscalMetrics.facturado || 0) + (fiscalMetrics.recibo || 0) || 1) * 100).toFixed(1)}% Facturado
                  </p>
                </div>
              </div>
            )}

            {/* Filtros Avanzados */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4 flex flex-wrap gap-4 items-end animate-fade-in">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Desde</label>
                <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="p-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="p-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Monto Min</label>
                <input type="number" value={filterMinAmount} onChange={e => setFilterMinAmount(e.target.value)} className="p-2 border rounded-md text-sm w-24" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Monto Max</label>
                <input type="number" value={filterMaxAmount} onChange={e => setFilterMaxAmount(e.target.value)} className="p-2 border rounded-md text-sm w-24" placeholder="Max" />
              </div>



              <button onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setFilterMinAmount(''); setFilterMaxAmount(''); setFilterNoReceipt(false); }} className="text-sm text-gray-500 hover:text-orange-500 underline">
                Limpiar
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
                        onChange={(e) => {
                          const newType = e.target.value;
                          let defaultCategory = 'ingreso_manual';
                          if (newType === 'egreso') {
                            // Si es tienda, default a gasto_operativo, sino egreso_manual
                            defaultCategory = (userRole === 'Tienda' || userRole === 'tienda' || userRole === 'empleado_tienda')
                              ? 'gasto_operativo'
                              : 'egreso_manual';
                          }
                          setFormData({
                            ...formData,
                            type: newType,
                            category: defaultCategory
                          });
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      >
                        <option value="ingreso">Ingreso</option>
                        <option value="egreso">Egreso</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      >
                        {formData.type === 'ingreso' ? (
                          <>
                            <option value="ingreso_manual">Ingreso General</option>
                            <option value="otros_ingresos">Otros Ingresos</option>
                            <option value="cobro_venta">Cobro de Venta</option>
                          </>
                        ) : (
                          <>
                            {(userRole === 'admin' || userRole === 'dueno') ? (
                              <>
                                <option value="egreso_manual">Gasto General</option>
                                <option value="gastos_fijos">Gastos Fijos (Luz, Agua, Alquiler)</option>
                                <option value="gastos_variables">Gastos Variables</option>
                                <option value="gasto_operativo">Gasto Operativo</option>
                                <option value="salida_caja_deposito">Salida a Depósito Bancario</option>
                                <option value="pago_deuda_compra">Pago Proveedor</option>
                              </>
                            ) : (
                              // Rol Tienda solo ve Gasto Operativo
                              <option value="gasto_operativo">Gasto Operativo</option>
                            )}
                          </>
                        )}
                      </select>
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cuenta / Caja <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.cuentaId || ''}
                      onChange={(e) => setFormData({ ...formData, cuentaId: e.target.value })}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 ${errors.cuentaId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                      required
                    >
                      <option value="">-- Seleccione una Cuenta / Caja --</option>
                      {bankAccounts.filter(acc => acc.isActive).map(acc => (
                        <option key={acc._id} value={acc._id}>
                          {acc.nombreBanco} ({acc.tipo === 'efectivo' ? 'Caja' : acc.numeroCuenta})
                          {(userRole === 'admin' || userRole === 'dueno') ? ` - ${formatCurrency(acc.saldo)}` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.cuentaId && <p className="text-xs text-red-500 mt-1">{errors.cuentaId}</p>}
                    {!errors.cuentaId && <p className="text-xs text-gray-500 mt-1">El monto se sumará o restará del saldo de esta cuenta.</p>}

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
                          category: 'ingreso_manual',
                          description: '',
                          amount: '',
                          date: new Date().toISOString().split('T')[0],
                          cuentaId: ''
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
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Transacciones</h2>
                <button
                  onClick={exportarTransaccionesPDF}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-md flex items-center gap-2"
                >
                  <span>📄</span> Exportar PDF
                </button>
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
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions
                        .filter(t => {
                          if (activeSubTab === 'ingreso' && t.type !== 'ingreso') return false;
                          
                          if (activeSubTab === 'egreso') {
                            if (t.type !== 'egreso') return false;
                            if (t.category === 'compra_materias' || t.category === 'compra_productos') return false;
                          }
                          
                          if (activeSubTab === 'inversion') {
                            if (t.type !== 'egreso') return false;
                            if (t.category !== 'compra_materias' && t.category !== 'compra_productos') return false;
                          }

                          const tDate = new Date(t.date);
                          if (filterStartDate && tDate < new Date(filterStartDate)) return false;
                          if (filterEndDate && tDate > new Date(filterEndDate)) return false;

                          if (filterMinAmount && t.amount < parseFloat(filterMinAmount)) return false;
                          if (filterMaxAmount && t.amount > parseFloat(filterMaxAmount)) return false;

                          // Filtro por Rol: Tienda solo ve Ingresos y Gasto Operativo
                          if (userRole === 'Tienda' || userRole === 'tienda' || userRole === 'empleado_tienda') {
                            if (t.type === 'egreso' && t.category !== 'gasto_operativo') return false;
                          }

                          return true;
                        })
                        .map((transaction) => (
                          <tr key={transaction._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(transaction.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(() => {
                                let badgeClass = 'bg-red-100 text-red-800';
                                let labelText = 'Egreso';
                                
                                if (transaction.type === 'ingreso') {
                                  badgeClass = 'bg-green-100 text-green-800';
                                  labelText = 'Ingreso';
                                } else if (transaction.category === 'compra_materias' || transaction.category === 'compra_productos') {
                                  badgeClass = 'bg-purple-100 text-purple-800';
                                  labelText = 'Inversión';
                                }

                                return (
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badgeClass}`}>
                                    {labelText}
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div className="flex items-center">
                                <span className="mr-3 text-xl">{getCategoryIcon(transaction.category || transaction.description)}</span>
                                <div>
                                  <div className="font-medium">{transaction.description}</div>
                                  {transaction.category && (
                                    <div className="text-xs text-gray-500 capitalize">
                                      {transaction.category.replace(/_/g, ' ')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <span className={transaction.type === 'ingreso' ? 'text-green-600' : 'text-red-600'}>
                                {transaction.type === 'ingreso' ? '+' : '-'}{formatCurrency(transaction.amount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {transaction.metadata?.banco || transaction.metadata?.cuenta || 
                                (transaction.metadata?.metodosPago && transaction.metadata.metodosPago.length > 0
                                  ? transaction.metadata.metodosPago.map(p => {
                                      const acc = bankAccounts.find(a => a._id === p.cuentaId);
                                      return acc ? `${acc.nombreBanco} (${acc.tipo === 'efectivo' ? 'Caja' : acc.numeroCuenta})` : p.tipo;
                                    }).join(' / ')
                                  : '-')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit(transaction)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(transaction._id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}

        {/* --- DEUDAS TAB --- */}
        {activeTab === 'deudas' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Cuentas por Pagar y Cobrar</h2>
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
              <div className="p-8 text-center bg-white rounded-xl shadow-md border border-gray-100">
                <p className="text-gray-500 italic">No hay cuentas pendientes</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor/Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ref.</th>
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
                          <td className="px-6 py-4 text-sm text-right">{formatCurrency(deuda.montoOriginal || (deuda.ventaId?.saldoPendiente + (deuda.montoPagado || 0) || 0))}</td>
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
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Pagar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- CUENTAS TAB --- */}
        {activeTab === 'cuentas' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Cuentas y Cajas</h2>
              <div className="flex gap-2">
                <button
                  onClick={exportarCuentasPDF}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-md flex items-center gap-2"
                >
                  <span>📄</span> Exportar PDF
                </button>
                <button
                  onClick={() => {
                    setEditingAccountId(null);
                    setAccountFormData({ nombreBanco: '', numeroCuenta: '', saldoInicial: '', tipo: 'banco' });
                    setShowAccountForm(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  + Nueva Cuenta
                </button>
                <button
                  onClick={() => {
                    setTransferFormData({ sourceAccountId: '', targetAccountId: '', amount: '', description: '' });
                    setShowInternalTransferModal(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ↔ Transferir Fondos
                </button>
              </div>
            </div>

            {/* Resumen Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                <p className="text-sm text-gray-500 mb-1">Total en Bancos</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {formatCurrency(bankAccounts.filter(a => a.tipo === 'banco' && a.isActive).reduce((sum, a) => sum + a.saldo, 0))}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-emerald-500">
                <p className="text-sm text-gray-500 mb-1">Total en Efectivo</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {formatCurrency(bankAccounts.filter(a => a.tipo === 'efectivo' && a.isActive).reduce((sum, a) => sum + a.saldo, 0))}
                </h3>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
                <p className="text-sm text-gray-500 mb-1">Capital Total Disponible</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {formatCurrency(bankAccounts.filter(a => a.isActive).reduce((sum, a) => sum + a.saldo, 0))}
                </h3>
              </div>
            </div>



            {/* Grilla de Cuentas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bankAccounts.map(account => (
                <div key={account._id} className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${account.isActive ? (account.tipo === 'efectivo' ? 'border-green-500' : 'border-blue-500') : 'border-gray-400 opacity-75'} relative`}>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => handleEditAccount(account)} className="text-gray-400 hover:text-blue-500" title="Editar">✏️</button>
                    <button onClick={() => handleUpdateAccountStatus(account)} className="text-gray-400 hover:text-red-500" title={account.isActive ? "Dar de baja" : "Activar"}>
                      {account.isActive ? '❌' : '✅'}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{account.tipo === 'efectivo' ? '💵' : '🏦'}</span>
                    <div>
                      <h4 className="font-bold text-lg text-gray-800">{account.nombreBanco}</h4>
                      <p className="text-xs text-gray-500">{account.tipo === 'efectivo' ? 'Caja Chica' : `Cuenta: ${account.numeroCuenta}`}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">Saldo Disponible</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(account.saldo)}</p>

                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => {
                        setSelectedAccount(account);
                        setShowDepositForm(true);
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${account.isActive ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      disabled={!account.isActive}
                    >
                      📥 Depositar
                    </button>
                    <button
                      onClick={() => handleViewHistory(account)}
                      className="flex-1 bg-gray-50 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                      📜 Historial
                    </button>
                  </div>
                  {!account.isActive && <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl pointer-events-none"><span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold transform -rotate-12 border border-red-200 shadow-sm">INACTIVA</span></div>}
                </div>
              ))}
            </div>

            {/* Modal Nueva/Editar Cuenta */}
            {showAccountForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">{editingAccountId ? 'Editar Cuenta' : 'Nueva Cuenta Bancaria'}</h3>
                  <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cuenta</label>
                      <select
                        value={accountFormData.tipo}
                        onChange={(e) => setAccountFormData({ ...accountFormData, tipo: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value="banco">Cuenta Bancaria</option>
                        <option value="efectivo">Caja / Efectivo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Banco</label>
                      <input
                        type="text"
                        value={accountFormData.nombreBanco}
                        onChange={(e) => setAccountFormData({ ...accountFormData, nombreBanco: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Ej: Banco Mercantil"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cuenta</label>
                      <input
                        type="text"
                        value={accountFormData.numeroCuenta}
                        onChange={(e) => setAccountFormData({ ...accountFormData, numeroCuenta: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="Ej: 12345678"
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
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        placeholder="0.00"
                        required={!editingAccountId}
                        disabled={!!editingAccountId}
                      />
                    </div>
                    <div className="flex space-x-3 mt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountForm(false);
                          setEditingAccountId(null);
                          setAccountFormData({ nombreBanco: '', numeroCuenta: '', saldoInicial: '' });
                        }}
                        className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- MAQUINARIA TAB --- */}
        {activeTab === 'maquinaria' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Activos y Maquinaria</h2>
                <p className="text-gray-500 text-sm">Registro de valor de maquinaria y equipos</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportarMaquinasPDF}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-md flex items-center gap-2"
                >
                  <span>📄</span> Exportar PDF
                </button>
                <button
                  onClick={() => setShowMaquinaForm(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                >
                  + Nueva Maquinaria
                </button>
              </div>
            </div>

            {/* Resumen de Valor */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
              <h3 className="text-gray-500 text-sm font-medium uppercase">Valor Total en Maquinaria</h3>
              <p className="text-3xl font-bold text-gray-800">{formatCurrency(maquinarias.reduce((acc, m) => acc + ((m.costo || 0) * (m.cantidad || 1)), 0))}</p>
            </div>

            {/* Lista de Maquinarias */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cant.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Costo (Valor)</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {maquinarias.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500 italic">No hay maquinarias registradas</td>
                    </tr>
                  ) : (
                    maquinarias.map((maquina) => (
                      <React.Fragment key={maquina._id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{maquina.nombre}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{maquina.tipo}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">{maquina.cantidad || 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${maquina.estado === 'Operativa' ? 'bg-green-100 text-green-800' :
                              maquina.estado === 'En mantenimiento' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {maquina.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-700">{formatCurrency((maquina.costo || 0) * (maquina.cantidad || 1))}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <button onClick={() => setExpandedMaquina(expandedMaquina === maquina._id ? null : maquina._id)} className="text-blue-600 hover:text-blue-900 mr-3">
                              {expandedMaquina === maquina._id ? 'Ocultar' : 'Historial'}
                            </button>
                            <button onClick={() => { setExpandedMaquina(maquina._id); setShowMantenimientoForm(true); }} className="text-purple-600 hover:text-purple-900 mr-3">
                              Mantenimiento
                            </button>
                            <button onClick={() => handleDeleteMaquina(maquina._id)} className="text-red-600 hover:text-red-900">
                              Eliminar
                            </button>
                          </td>
                        </tr>
                        {expandedMaquina === maquina._id && (
                          <tr className="bg-gray-50">
                            <td colSpan="5" className="px-6 py-4">
                              <div className="text-sm">
                                <h4 className="font-semibold mb-2">Historial de Mantenimiento</h4>
                                {maquina.historialMantenimiento && maquina.historialMantenimiento.length > 0 ? (
                                  <ul className="space-y-2">
                                    {maquina.historialMantenimiento.map((mant, idx) => (
                                      <li key={idx} className="flex justify-between items-center border-b pb-1">
                                        <span>{new Date(mant.fecha).toLocaleDateString()}: {mant.descripcion}</span>
                                        <span className="font-bold text-red-600">-{formatCurrency(mant.costo)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-gray-500 italic">No hay registros de mantenimiento.</p>
                                )}

                                <div className="mt-2 text-xs text-gray-500">
                                  Último mantenimiento: {maquina.ultimoMantenimiento ? new Date(maquina.ultimoMantenimiento).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Formulario Modal Maquinaria */}
            {showMaquinaForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">Registrar Maquinaria</h2>
                  <form onSubmit={handleCreateMaquina} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                      <input type="text" required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        value={maquinaFormData.nombre} onChange={e => setMaquinaFormData({ ...maquinaFormData, nombre: e.target.value })} placeholder="Ej. Sierra de Mesa" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                      <select required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        value={maquinaFormData.tipo} onChange={e => setMaquinaFormData({ ...maquinaFormData, tipo: e.target.value })}>
                        <option value="">Seleccionar Tipo</option>
                        <option value="Corte">Corte</option>
                        <option value="Ensamblaje">Ensamblaje</option>
                        <option value="Acabado">Acabado</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                      <input type="number" required min="1" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        value={maquinaFormData.cantidad} onChange={e => setMaquinaFormData({ ...maquinaFormData, cantidad: parseInt(e.target.value) })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario (Bs.)</label>
                      <input type="number" required min="0" step="0.01" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        value={maquinaFormData.costo} onChange={e => setMaquinaFormData({ ...maquinaFormData, costo: e.target.value })} placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                        value={maquinaFormData.estado} onChange={e => setMaquinaFormData({ ...maquinaFormData, estado: e.target.value })}>
                        <option value="Operativa">Operativa</option>
                        <option value="En mantenimiento">En mantenimiento</option>
                        <option value="Fuera de servicio">Fuera de servicio</option>
                      </select>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <button type="button" onClick={() => setShowMaquinaForm(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">Cancelar</button>
                      <button type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">Guardar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal Registrar Mantenimiento */}
            {showMantenimientoForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">Registrar Mantenimiento</h2>
                  <form onSubmit={handleRegistrarMantenimiento} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                      <input type="date" required className="w-full p-2 border rounded-lg"
                        value={mantenimientoFormData.fecha} onChange={e => setMantenimientoFormData({ ...mantenimientoFormData, fecha: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                      <input type="text" required className="w-full p-2 border rounded-lg"
                        value={mantenimientoFormData.descripcion} onChange={e => setMantenimientoFormData({ ...mantenimientoFormData, descripcion: e.target.value })} placeholder="Ej. Cambio de Aceite" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Costo (Bs.)</label>
                      <input type="number" required min="0" step="0.01" className="w-full p-2 border rounded-lg"
                        value={mantenimientoFormData.costo} onChange={e => setMantenimientoFormData({ ...mantenimientoFormData, costo: e.target.value })} placeholder="0.00" />
                    </div>

                    <div className="flex gap-4 pt-2">
                      <button type="button" onClick={() => setShowMantenimientoForm(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">Cancelar</button>
                      <button type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">Registrar</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )
        }


        {/* Modal Depósito */}
        {
          showDepositForm && selectedAccount && (
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
                  <div className="flex space-x-3 mt-6">
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Confirmar Depósito</button>
                    <button type="button" onClick={() => setShowDepositForm(false)} className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600">Cancelar</button>
                  </div>
                </form>
              </div>
            </div>
          )
        }

        {/* Modal Transferencia por Cierre */}
        {
          showTransferModal && accountToClose && (
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
          )
        }

        {/* Modal Historial */}
        {
          showHistoryModal && selectedAccount && (
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
                              <span className={`px-2 py-1 rounded-full text-xs ${['Depósito', 'Deposito', 'Ingreso'].includes(tx.tipo) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {tx.tipo}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">{tx.descripcion}</td>
                            <td className={`px-4 py-2 text-sm text-right font-medium ${['Depósito', 'Deposito', 'Ingreso'].includes(tx.tipo) ? 'text-green-600' : 'text-red-600'}`}>
                              {['Depósito', 'Deposito', 'Ingreso'].includes(tx.tipo) ? '+' : '-'}{formatCurrency(tx.monto)}
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
          )
        }
        {/* Modal Transferencia Interna */}
        {showInternalTransferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Transferencia Interna de Fondos</h3>
              <form onSubmit={handleInternalTransfer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Origen</label>
                  <select
                    value={transferFormData.sourceAccountId}
                    onChange={(e) => setTransferFormData({ ...transferFormData, sourceAccountId: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Seleccionar Origen --</option>
                    {bankAccounts
                      .filter(acc => acc.isActive && acc.saldo > 0)
                      .map(acc => (
                        <option key={acc._id} value={acc._id}>
                          {acc.nombreBanco} ({acc.numeroCuenta}) - {formatCurrency(acc.saldo)}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Destino</label>
                  <select
                    value={transferFormData.targetAccountId}
                    onChange={(e) => setTransferFormData({ ...transferFormData, targetAccountId: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Seleccionar Destino --</option>
                    {bankAccounts
                      .filter(acc => acc.isActive && acc._id !== transferFormData.sourceAccountId)
                      .map(acc => (
                        <option key={acc._id} value={acc._id}>
                          {acc.nombreBanco} ({acc.numeroCuenta || 'Efectivo'}) - {formatCurrency(acc.saldo)}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto a Transferir</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={transferFormData.amount}
                    onChange={(e) => setTransferFormData({ ...transferFormData, amount: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Motivo</label>
                  <input
                    type="text"
                    value={transferFormData.description}
                    onChange={(e) => setTransferFormData({ ...transferFormData, description: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Reposición de caja chica"
                    required
                  />
                </div>

                <div className="flex space-x-3 mt-6">
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Transferir
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInternalTransferModal(false)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
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
