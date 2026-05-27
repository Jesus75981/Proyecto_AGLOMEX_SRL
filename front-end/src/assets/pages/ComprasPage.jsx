// front-end/src/assets/pages/ComprasPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- API Helper ---
import { API_URL } from '../../config/api';

const getAuthToken = () => {
  return localStorage.getItem('token');
};

const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    throw new Error('Token no válido');
  }

  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Token no válido');
    }
    const errorData = await response.json();
    throw new Error(errorData.message || errorData.error || 'Error en la petición a la API');
  }

  return response.json();
};


const ComprasPage = ({ userRole }) => {
  const navigate = useNavigate();

  // --- Estados de Gestión de Proveedores ---
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supplierEditing, setSupplierEditing] = useState(null);
  const [supplierFormData, setSupplierFormData] = useState({
    nombre: '',
    nombreComercial: '',
    contacto: { telefono: '', email: '' },
    direccion: '',
    ubicacion: '',
    ciudad: '',
    nit: '',
    bancos: []
  });
  const [supplierErrors, setSupplierErrors] = useState({});

  const validarProveedor = () => {
    const errors = {};
    if (!supplierFormData.nombre) errors.nombre = 'El nombre es obligatorio';
    setSupplierErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Funciones para gestionar bancos en el formulario de edición/creación principal
  const addBankToForm = () => {
    setSupplierFormData({
      ...supplierFormData,
      bancos: [...(supplierFormData.bancos || []), { nombre: '', numeroCuenta: '' }]
    });
  };

  const updateBankInForm = (index, field, value) => {
    const newBancos = [...(supplierFormData.bancos || [])];
    newBancos[index] = { ...newBancos[index], [field]: value };
    setSupplierFormData({ ...supplierFormData, bancos: newBancos });
  };

  const removeBankFromForm = (index) => {
    const newBancos = [...(supplierFormData.bancos || [])];
    newBancos.splice(index, 1);
    setSupplierFormData({ ...supplierFormData, bancos: newBancos });
  };

  const handleEditProveedor = (proveedor) => {
    setSupplierFormData({
      nombre: proveedor.nombre,
      nombreComercial: proveedor.nombreComercial || '',
      contacto: proveedor.contacto || { telefono: '', email: '' },
      direccion: proveedor.direccion || '',
      ubicacion: proveedor.ubicacion || '',
      ciudad: proveedor.ciudad || '',
      nit: proveedor.nit || '',
      bancos: proveedor.bancos || []
    });
    setSupplierEditing(proveedor);
    setShowSupplierForm(true);
  };

  const handleDeleteProveedor = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este proveedor?')) return;
    try {
      await apiFetch(`/proveedores/${id}`, { method: 'DELETE' });
      setProveedores(proveedores.filter(p => p._id !== id));
      alert('Proveedor eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      alert('Error al eliminar proveedor: ' + error.message);
    }
  };

  const crearProveedor = async () => {
    if (!validarProveedor()) return;
    try {
      const proveedorCreado = await apiFetch('/proveedores', {
        method: 'POST',
        body: JSON.stringify(supplierFormData)
      });
      setProveedores([...proveedores, proveedorCreado]);
      setShowSupplierForm(false);
      setSupplierFormData({ nombre: '', nombreComercial: '', contacto: { telefono: '', email: '' }, direccion: '', ubicacion: '', ciudad: '', nit: '', bancos: [] });
      alert('Proveedor creado exitosamente');
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      alert('Error al crear proveedor: ' + error.message);
    }
  };

  const actualizarProveedor = async () => {
    if (!validarProveedor()) return;
    try {
      const proveedorActualizado = await apiFetch(`/proveedores/${supplierEditing._id}`, {
        method: 'PUT',
        body: JSON.stringify(supplierFormData)
      });
      setProveedores(proveedores.map(p => p._id === supplierEditing._id ? proveedorActualizado : p));
      setSupplierEditing(null);
      setShowSupplierForm(false);
      setSupplierFormData({ nombre: '', nombreComercial: '', contacto: { telefono: '', email: '' }, direccion: '', ubicacion: '', ciudad: '', nit: '', bancos: [] });
      alert('Proveedor actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      alert('Error al actualizar proveedor: ' + error.message);
    }
  };

  const handleSaveSupplier = () => {
    if (supplierEditing) {
      actualizarProveedor();
    } else {
      crearProveedor();
    }
  };

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const volverAlHome = () => navigate('/home');

  const verDetallesCompra = (compra) => {
    setSelectedCompra(compra);
    setShowDetailModal(true);
  };

  // --- Exportar Compra Detallada a PDF ---
  const exportarCompraPDF = (compra) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const fecha = new Date(compra.fecha).toLocaleDateString('es-ES');

    // Título y Encabezado
    doc.setFontSize(20);
    doc.setTextColor(126, 34, 206); // Purple-700
    doc.text("DETALLES DE COMPRA", 14, 22);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Compra #${compra.numCompra || compra._id}`, 14, 30);
    doc.text(`Fecha: ${fecha}`, 14, 36);

    // Línea divisoria
    doc.setDrawColor(229, 231, 235);
    doc.line(14, 42, pageWidth - 14, 42);

    // Información del Proveedor
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Información del Proveedor", 14, 52);
    doc.setFontSize(10);
    doc.setTextColor(70);

    if (compra.proveedor) {
      doc.text(`Nombre: ${compra.proveedor.nombre}`, 14, 60);
      if (compra.proveedor.nombreComercial) doc.text(`Nombre Comercial: ${compra.proveedor.nombreComercial}`, 14, 66);
      if (compra.proveedor.nit) doc.text(`NIT: ${compra.proveedor.nit}`, 14, 72);
      if (compra.proveedor.contacto?.telefono) doc.text(`Teléfono: ${compra.proveedor.contacto.telefono}`, 14, 78);
    } else {
      doc.text("Proveedor no especificado", 14, 60);
    }

    // Resumen de Compra
    doc.text("Resumen de Compra", 120, 52);
    doc.text(`Estado: ${compra.estado}`, 120, 60);
    doc.text(`Tipo: ${compra.tipoCompra}`, 120, 66);
    doc.text(`Factura Nº: ${compra.numeroFactura || '-'}`, 120, 72);

    // Tabla de Productos
    const columns = ["Producto", "Código", "Color", "Cant.", "Costo Unit.", "Subtotal"];
    const rows = compra.productos.map(item => [
      item.nombreProducto || 'N/A',
      item.codigo || '-',
      item.colorProducto || '-',
      item.cantidad,
      `Bs. ${item.precioUnitario.toFixed(2)}`,
      `Bs. ${(item.cantidad * item.precioUnitario).toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 85,
      theme: 'striped',
      headStyles: { fillColor: [126, 34, 206], textColor: 255 }, // Purple-700
      columnStyles: {
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Métodos de Pago
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Desglose de Pagos", 14, finalY);

    let paymentY = finalY + 8;
    doc.setFontSize(10);
    doc.setTextColor(70);

    if (compra.metodosPago && compra.metodosPago.length > 0) {
      compra.metodosPago.forEach(pago => {
        let cuentaInfo = "";
        if (pago.cuentaId) {
          const cuenta = bankAccounts.find(acc => acc._id === pago.cuentaId);
          if (cuenta) {
            cuentaInfo = ` - Desde: ${cuenta.nombreBanco} (${cuenta.numeroCuenta})`;
          }
        } else if (pago.cuenta) {
          cuentaInfo = ` (${pago.cuenta})`;
        }
        doc.text(`• ${pago.tipo}: Bs. ${pago.monto.toFixed(2)}${cuentaInfo}`, 14, paymentY);
        paymentY += 6;
      });
    } else {
      doc.text("No hay pagos registrados", 14, paymentY);
      paymentY += 6;
    }

    // Totales
    doc.setFontSize(14);
    doc.setTextColor(126, 34, 206);
    doc.setFont(undefined, 'bold');
    doc.text(`TOTAL COMPRA:`, 140, paymentY + 10);
    doc.text(`Bs. ${compra.totalCompra.toFixed(2)}`, 190, paymentY + 10, { align: 'right' });

    doc.setFont(undefined, 'normal');
    const totalPagado = compra.metodosPago?.filter(p => p.tipo !== 'Crédito').reduce((acc, curr) => acc + curr.monto, 0) || 0;
    doc.setTextColor(22, 163, 74); // Green
    doc.text(`TOTAL PAGADO:`, 140, paymentY + 17);
    doc.text(`Bs. ${totalPagado.toFixed(2)}`, 190, paymentY + 17, { align: 'right' });

    doc.setTextColor(200, 0, 0); // Red
    doc.text(`SALDO PENDIENTE:`, 140, paymentY + 24);
    doc.text(`Bs. ${(compra.saldoPendiente || 0).toFixed(2)}`, 190, paymentY + 24, { align: 'right' });

    // Observaciones
    if (compra.observaciones) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Observaciones:", 14, paymentY + 35);
      doc.setFontSize(9);
      doc.text(doc.splitTextToSize(compra.observaciones, pageWidth - 28), 14, paymentY + 41);
    }

    doc.save(`Compra_${compra.numCompra || compra._id}_${fecha.replace(/\//g, '-')}.pdf`);
  };

  // --- Estados ---
  const [activeSection, setActiveSection] = useState('realizarCompra');
  const [searchTerm, setSearchTerm] = useState('');

  // Data from API
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [materiasPrimas, setMateriasPrimas] = useState([]); // Nuevo estado para Materia Prima
  const [categorias, setCategorias] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]); // New state for bank accounts
  const [historialCompras, setHistorialCompras] = useState([]); // Historial state
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Search & Filtering
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [mostrarResultadosProveedor, setMostrarResultadosProveedor] = useState(false);
  const [mostrarResultadosProducto, setMostrarResultadosProducto] = useState(false);
  const [mostrarResultadosCategoria, setMostrarResultadosCategoria] = useState(false);

  // Fetch automatic purchase number from API
  const fetchSiguienteNumeroCompra = async () => {
    try {
      const data = await apiFetch('/compras/siguiente-numero');
      setCompra(prev => ({ ...prev, numeroCompra: data.siguienteNumero }));
    } catch (error) {
      console.error("Error fetching next purchase number:", error);
      // Fallback to local generation if API fails
      const fecha = new Date();
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      const timestamp = Date.now().toString().slice(-4);
      setCompra(prev => ({ ...prev, numeroCompra: `COMP-${year}${month}${day}-${timestamp}` }));
    }
  };

  useEffect(() => {
    fetchSiguienteNumeroCompra();
  }, []);

  // Main Purchase Form
  const [compra, setCompra] = useState({
    fecha: new Date().toISOString().split('T')[0],
    numeroCompra: '', // Will be fetched from API
    tipoCompra: 'Materia Prima', // Default value, can be changed
    proveedorId: '',
    proveedorNombre: '',
    observaciones: '',
    numeroFactura: '',
    metodoPago: [],
    productos: [],
    anticipos: []
  });

  // Temporary states for forms
  const [productoTemporal, setProductoTemporal] = useState({
    productoId: '',
    productoNombre: '',
    cantidad: 1,
    costoUnitario: 0
  });

  // Form visibility
  const [showProveedorForm, setShowProveedorForm] = useState(false);
  const [showProductoForm, setShowProductoForm] = useState(false);

  // Payment - Dynamic list
  const [listaPagos, setListaPagos] = useState([]); // [{ id: 1, tipo: 'Efectivo', monto: 0, cuenta: '' }]
  const [chequeImage, setChequeImage] = useState(null);

  // New item forms
  const [nuevoProveedor, setNuevoProveedor] = useState({
    nombre: '',
    nombreComercial: '',
    contacto: { telefono: '', email: '' },
    direccion: '',
    ubicacion: '',
    nit: '',
    bancos: [{ nombre: '', numeroCuenta: '' }]
  });

  // Funciones para manejar bancos
  const agregarBanco = () => {
    setNuevoProveedor(prev => ({
      ...prev,
      bancos: [...prev.bancos, { nombre: '', numeroCuenta: '' }]
    }));
  };

  const actualizarBanco = (index, campo, valor) => {
    setNuevoProveedor(prev => ({
      ...prev,
      bancos: prev.bancos.map((banco, i) =>
        i === index ? { ...banco, [campo]: valor } : banco
      )
    }));
  };

  const eliminarBanco = (index) => {
    setNuevoProveedor(prev => ({
      ...prev,
      bancos: prev.bancos.filter((_, i) => i !== index)
    }));
  };

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    nuevaCategoria: '',
    tipo: 'Producto Terminado', // Default
    color: '',
    marca: '',
    ubicacion: '',
    proveedor: '',
    codigo: '',
    cajas: '', // Nuevo campo para cajas
    dimensiones: {
      alto: '',
      ancho: '',
      profundidad: ''
    }
  });
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  // --- Data Loading ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [proveedoresData, productosData, materiaPrimaData, cuentasData] = await Promise.all([
          apiFetch('/proveedores'),
          apiFetch('/productos'),
          apiFetch('/materiaPrima'),
          apiFetch('/finanzas/cuentas') // Fetch bank accounts
        ]);
        setProveedores(proveedoresData);
        setProductos(productosData);
        setMateriasPrimas(materiaPrimaData);
        setBankAccounts(cuentasData);

      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.message.includes('Token no válido') || error.message.includes('403') || error.message.includes('Forbidden')) {
          alert('Sesión expirada. Redirigiendo al login.');
          navigate('/login');
        } else {
          alert('No se pudo cargar la información inicial. Verifique la conexión con el servidor.');
        }
      }
    };
    fetchData();
  }, [navigate]);

  // Fetch Categories when Type changes
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        if (nuevoProducto.tipo === 'Materia Prima') {
          const data = await apiFetch('/materiaPrima/categorias');
          // data is array of strings
          setCategorias(data);
        } else {
          const data = await apiFetch('/categorias');
          // data is array of objects { _id, nombre }
          setCategorias(data.map(c => c.nombre));
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, [nuevoProducto.tipo]);

  // --- Search Effects ---
  useEffect(() => {
    if (busquedaProveedor) {
      const filtrados = proveedores.filter(p =>
        (p.nombre && p.nombre.toLowerCase().includes(busquedaProveedor.toLowerCase())) ||
        (p.nombreComercial && p.nombreComercial.toLowerCase().includes(busquedaProveedor.toLowerCase())) ||
        (p.nit && p.nit.toLowerCase().includes(busquedaProveedor.toLowerCase()))
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
      const listaBusqueda = compra.tipoCompra === 'Materia Prima' ? materiasPrimas : productos;
      const filtrados = listaBusqueda.filter(p =>
        (p.nombre && p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase())) ||
        (p.codigo && p.codigo.toLowerCase().includes(busquedaProducto.toLowerCase()))
      );
      setProductosFiltrados(filtrados);
      setMostrarResultadosProducto(true);
    } else {
      setProductosFiltrados([]);
      setMostrarResultadosProducto(false);
    }
  }, [busquedaProducto, productos, materiasPrimas, compra.tipoCompra]);

  // --- Calculations ---
  const totalCompra = compra.productos.reduce((total, item) => total + item.costoTotal, 0);
  const totalPagado = listaPagos.reduce((total, p) => {
    return p.tipo === 'Crédito' ? total : total + (parseFloat(p.monto) || 0);
  }, 0);
  const saldoPendiente = Math.max(0, totalCompra - totalPagado);

  // --- Handlers ---

  const handleCrearProveedor = async () => {
    if (!nuevoProveedor.nombre || !nuevoProveedor.nit) {
      alert('Nombre y NIT del proveedor son requeridos.');
      return;
    }
    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (nuevoProveedor.contacto.email && !emailRegex.test(nuevoProveedor.contacto.email)) {
      alert('Por favor ingrese un email válido.');
      return;
    }
    // Validación de teléfono (ejemplo: solo números, mínimo 7 dígitos)
    const phoneRegex = /^\d{7,15}$/;
    if (nuevoProveedor.contacto.telefono && !phoneRegex.test(nuevoProveedor.contacto.telefono)) {
      alert('Por favor ingrese un número de teléfono válido (solo números, 7-15 dígitos).');
      return;
    }
    try {
      const proveedorCreado = await apiFetch('/proveedores', {
        method: 'POST',
        body: JSON.stringify(nuevoProveedor)
      });
      setProveedores([...proveedores, proveedorCreado]);
      setShowProveedorForm(false);
      setNuevoProveedor({
        nombre: '',
        nombreComercial: '',
        contacto: { telefono: '', email: '' },
        direccion: '',
        ubicacion: '',
        nit: '',
        bancos: [{ nombre: '', numeroCuenta: '' }]
      });
      seleccionarProveedor(proveedorCreado); // Auto-select the new provider
      alert('Proveedor creado y seleccionado exitosamente.');
    } catch (error) {
      console.error("Error creando proveedor:", error);
      alert(`Error creando proveedor: ${error.message}`);
    }
  };

  const seleccionarProveedor = (proveedor) => {
    setCompra({
      ...compra,
      proveedorId: proveedor._id,
      proveedorNombre: proveedor.nombre
    });
    setBusquedaProveedor(proveedor.nombre);
    setMostrarResultadosProveedor(false);
  };

  const handleCategoriaChange = (e) => {
    const value = e.target.value;
    if (value === 'nueva') {
      setNuevoProducto(prev => ({
        ...prev,
        categoria: 'nueva',
        nuevaCategoria: ''
      }));
    } else {
      setNuevoProducto(prev => ({
        ...prev,
        categoria: value,
        nuevaCategoria: ''
      }));
    }
  };

  const handleCrearProducto = async () => {
    if (!nuevoProducto.nombre || !nuevoProducto.categoria || !nuevoProducto.color || !nuevoProducto.codigo || !nuevoProducto.cajas) {
      alert('Todos los campos son obligatorios: Nombre, Código, Categoría, Color y Cajas.');
      return;
    }
    if (nuevoProducto.categoria === 'Mesas') {
      alert('La categoría "Mesas" no es válida. Selecciona "Mesa" en su lugar.');
      return;
    }

    // Usar la categoría escrita en el input
    const categoriaFinal = nuevoProducto.categoria.trim();

    if (!categoriaFinal) {
      alert('Debe ingresar una categoría');
      return;
    }

    try {
      // Filtrar campos vacíos para evitar errores de ObjectId
      const productoData = { ...nuevoProducto };
      if (!productoData.proveedor || productoData.proveedor === '') {
        delete productoData.proveedor;
      }
      if (!productoData.marca || productoData.marca === '') {
        delete productoData.marca;
      }

      // Usar la categoría final
      productoData.categoria = categoriaFinal;

      // Verificar si la categoría ya existe, si no, crearla
      if (!categorias.includes(categoriaFinal)) {
        try {
          await apiFetch('/categorias', {
            method: 'POST',
            body: JSON.stringify({ nombre: categoriaFinal })
          });
          // Actualizar lista de categorías localmente
          setCategorias([...categorias, categoriaFinal]);
        } catch (catError) {
          console.error("Error guardando categoría:", catError);
          // No detenemos la creación del producto si falla la categoría, pero avisamos
        }
      }

      const formData = new FormData();
      formData.append('nombre', nuevoProducto.nombre);
      formData.append('descripcion', nuevoProducto.descripcion);
      formData.append('categoria', categoriaFinal);
      formData.append('tipo', nuevoProducto.tipo || 'Producto Terminado');
      formData.append('color', nuevoProducto.color);
      formData.append('marca', nuevoProducto.marca || '');
      formData.append('ubicacion', nuevoProducto.ubicacion || '');
      // Ensure proveedor is sent as ID
      formData.append('proveedor', nuevoProducto.proveedor || '');
      formData.append('codigo', nuevoProducto.codigo);
      formData.append('cajas', nuevoProducto.cajas);

      // Flatten dimensions
      formData.append('dimensiones[alto]', nuevoProducto.dimensiones.alto || 0);
      formData.append('dimensiones[ancho]', nuevoProducto.dimensiones.ancho || 0);
      formData.append('dimensiones[profundidad]', nuevoProducto.dimensiones.profundidad || 0);

      // Also append flattened keys for backend consistency if controller expects dimensions.alto directly from body or file
      // My controller check was req.body['dimensiones.alto']
      formData.append('dimensiones.alto', nuevoProducto.dimensiones.alto || 0);
      formData.append('dimensiones.ancho', nuevoProducto.dimensiones.ancho || 0);
      formData.append('dimensiones.profundidad', nuevoProducto.dimensiones.profundidad || 0);


      if (selectedImageFile) {
        formData.append('imagen', selectedImageFile);
      }

      const isMateriaPrima = nuevoProducto.tipo === 'Materia Prima';
      const endpoint = isMateriaPrima ? '/materiaPrima' : '/productos';

      if (isMateriaPrima) {
        // Campos requeridos por MateriaPrima que el formulario no tiene
        formData.append('precioCompra', 0);
        formData.append('precioVenta', 0);
        // Convertir dimensiones a string tamano if needed for legacy support, but dimensions obj is superior
        const dims = [
          nuevoProducto.dimensiones.alto ? `${nuevoProducto.dimensiones.alto}cm` : '',
          nuevoProducto.dimensiones.ancho ? `${nuevoProducto.dimensiones.ancho}cm` : '',
          nuevoProducto.dimensiones.profundidad ? `${nuevoProducto.dimensiones.profundidad}cm` : ''
        ].filter(Boolean).join(' x ');
        formData.append('tamano', dims);
      }

      const token = getAuthToken();
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Error en la petición a la API');
      }

      const productoCreado = await response.json();

      if (isMateriaPrima) {
        setMateriasPrimas([...materiasPrimas, productoCreado]);
      } else {
        setProductos([...productos, productoCreado]);
      }
      setShowProductoForm(false);
      setNuevoProducto({ nombre: '', descripcion: '', categoria: '', nuevaCategoria: '', color: '', marca: '', ubicacion: '', proveedor: '', codigo: '', cajas: '', tipo: 'Producto Terminado', dimensiones: { alto: '', ancho: '', profundidad: '' } });
      setSelectedImageFile(null);
      alert('Producto creado exitosamente.');
    } catch (error) {
      console.error("Error creando producto:", error);
      alert(`Error creando producto: ${error.message}`);
    }
  };

  const seleccionarProducto = (producto) => {
    setProductoTemporal({
      productoId: producto._id,
      productoNombre: producto.nombre,
      cantidad: 1,
      costoUnitario: '' // Empty string to prevent autocomplete
    });
    setBusquedaProducto(producto.nombre);
    setMostrarResultadosProducto(false);
  };

  const eliminarProductoDeCompra = (index) => {
    const nuevosProductos = [...compra.productos];
    nuevosProductos.splice(index, 1);
    setCompra({ ...compra, productos: nuevosProductos });
  };

  const agregarProductoACompra = () => {
    if (!productoTemporal.productoId || productoTemporal.cantidad <= 0 || productoTemporal.costoUnitario <= 0) {
      alert('Seleccione un producto y asegúrese que la cantidad y el costo son mayores a 0.');
      return;
    }

    const listaBusqueda = compra.tipoCompra === 'Materia Prima' ? materiasPrimas : productos;
    const productoSeleccionado = listaBusqueda.find(p => p._id === productoTemporal.productoId);
    if (!productoSeleccionado) return;

    const productoCompra = {
      _id: productoSeleccionado._id,
      nombre: productoSeleccionado.nombre,
      codigo: productoSeleccionado.codigo,
      color: productoSeleccionado.color,
      cantidad: productoTemporal.cantidad,
      costoUnitario: productoTemporal.costoUnitario,
      categoria: productoSeleccionado.categoria,
      costoTotal: productoTemporal.cantidad * productoTemporal.costoUnitario
    };

    setCompra({
      ...compra,
      productos: [...compra.productos, productoCompra]
    });

    // Reset temporary product form
    setProductoTemporal({ productoId: '', productoNombre: '', cantidad: 1, costoUnitario: 0 });
    setBusquedaProducto('');
  };

  const toggleMetodoPago = (metodo) => {
    const nuevosMetodos = compra.metodoPago.includes(metodo)
      ? compra.metodoPago.filter(m => m !== metodo)
      : [...compra.metodoPago, metodo];
    setCompra({ ...compra, metodoPago: nuevosMetodos });
  };

  const confirmarCompra = async () => {
    if (!compra.proveedorId) {
      alert('Debe seleccionar un proveedor.');
      return;
    }
    if (compra.productos.length === 0) {
      alert('Debe agregar al menos un producto a la compra.');
      return;
    }

    // Validación de factura ELIMINADA: opcional
    // if (!compra.numeroFactura) {
    //  alert('El número de factura es OBLIGATORIO para registrar la compra.');
    //  return;
    // }

    // Validar montos
    const totalPagos = listaPagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
    const totalCredito = listaPagos.filter(p => p.tipo === 'Crédito').reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);

    if (totalPagos === 0 && totalCredito === 0) {
      alert('Debe registrar al menos un método de pago o un monto a crédito.');
      return;
    }

    // Validación para pago con cheque: verificar imagen y monto
    const tieneCheque = listaPagos.some(p => p.tipo === 'Cheque');
    if (tieneCheque) {
      if (!chequeImage) {
        alert('Debe subir una imagen del cheque para pagos con cheque.');
        return;
      }
      // Aquí podrías agregar lógica para verificar el monto en la imagen, pero por ahora solo validamos que esté presente
      // En un futuro, integrar OCR para leer el monto del cheque
    }

    // Validar que se haya seleccionado una cuenta/caja de origen
    const pagoSinCuenta = listaPagos.find(p => p.tipo !== 'Crédito' && !p.cuentaId);
    if (pagoSinCuenta) {
      alert(`Debe seleccionar una Caja o Cuenta Bancaria de origen para el pago con ${pagoSinCuenta.tipo}.`);
      return;
    }

    const compraData = {
      numCompra: compra.numeroCompra,
      fecha: compra.fecha,
      tipoCompra: compra.tipoCompra,
      proveedor: compra.proveedorId,
      productos: compra.productos.map(p => ({
        producto: p._id,
        cantidad: p.cantidad,
        precioUnitario: p.costoUnitario,
        nombreProducto: p.nombre,
        codigo: p.codigo, // Send Code
        colorProducto: p.color,
        categoriaProducto: p.categoria,
        dimensiones: { alto: 0, ancho: 0, profundidad: 0 }, // Default dimensions
        imagenProducto: '' // Default empty image
      })),
      metodosPago: listaPagos.map(p => ({
        tipo: p.tipo,
        monto: parseFloat(p.monto) || 0,
        referencia: p.tipo === 'Cheque' ? 'REF-CHQ-' + Date.now() : '',
        cuenta: p.cuenta || '',
        cuentaId: p.cuentaId || null // Send account ID for all payments
      })),
      totalCompra: totalCompra,
      observaciones: compra.observaciones,
      chequeImage: chequeImage ? chequeImage.name : null // Solo el nombre por ahora, en producción subir a servidor
    };

    try {
      const compraCreada = await apiFetch('/compras', {
        method: 'POST',
        body: JSON.stringify(compraData)
      });

      const totalPagado = listaPagos.reduce((total, p) => {
        return p.tipo === 'Crédito' ? total : total + (parseFloat(p.monto) || 0);
      }, 0);
      const saldoPendiente = totalCompra - totalPagado;

      if (saldoPendiente > 0) {
        alert(`Compra registrada exitosamente. Total: Bs. ${totalCompra.toFixed(2)}. Pagado: Bs. ${totalPagado.toFixed(2)}. Saldo Pendiente: Bs. ${saldoPendiente.toFixed(2)}. Estado: PENDIENTE DE PAGO.`);
      } else {
        alert(`Compra registrada exitosamente. Total: Bs. ${totalCompra.toFixed(2)}. Estado: PAGADA.`);
      }

      if (compra.tipoCompra === 'Materia Prima') {
        navigate('/fabricacion', { state: { initialTab: 'materiales' } });
      } else {
        navigate('/inventario');
      }

      // Reset form
      setCompra({
        fecha: new Date().toISOString().split('T')[0],
        numeroCompra: '', // Will be refreshed
        tipoCompra: 'Materia Prima', // Reset to default
        proveedorId: '',
        proveedorNombre: '',
        observaciones: '',
        numeroFactura: '',
        metodoPago: [],
        productos: [],
        anticipos: []
      });
      setListaPagos([]);
      setChequeImage(null);
      fetchSiguienteNumeroCompra(); // Refresh number for next purchase
    } catch (error) {
      console.error("Error al confirmar la compra:", error);
      alert(`Error al registrar la compra: ${error.message}`);
    }
  };

  const agregarPago = () => {
    setListaPagos([...listaPagos, { id: Date.now(), tipo: 'Efectivo', monto: '', cuenta: '' }]);
  };

  const eliminarPago = (id) => {
    setListaPagos(listaPagos.filter(p => p.id !== id));
  };

  const actualizarPago = (id, campo, valor) => {
    setListaPagos(listaPagos.map(p => p.id === id ? { ...p, [campo]: valor } : p));
  };

  // --- Historial Logic ---
  useEffect(() => {
    if (activeSection === 'historial') {
      const cargarHistorial = async () => {
        try {
          const compras = await apiFetch('/compras');
          setHistorialCompras(compras);
        } catch (error) {
          console.error("Error cargando historial de compras:", error);
        }
      };
      cargarHistorial();
    }
  }, [activeSection]);

  const handleEliminarCompra = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta compra? Esta acción revertirá el inventario y devolverá el dinero a la cuenta si corresponde.')) return;
    try {
      await apiFetch(`/compras/${id}`, { method: 'DELETE' });
      setHistorialCompras(historialCompras.filter(c => c._id !== id));
      alert('Compra eliminada y transacciones revertidas correctamente.');
    } catch (error) {
      console.error("Error eliminando compra:", error);
      alert(`Error al eliminar compra: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={volverAlHome}
              className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <span>←</span>
              <span>Menú</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Módulo de Compras (CRUD)</h1>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setActiveSection('realizarCompra')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeSection === 'realizarCompra'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
            >
              Realizar Compra
            </button>
            <button
              onClick={() => setActiveSection('proveedores')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeSection === 'proveedores'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
            >
              Gestionar Proveedores
            </button>
            <button
              onClick={() => setActiveSection('historial')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeSection === 'historial'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
            >
              Historial
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">

        {/* --- SECCIÓN REALIZAR COMPRA --- */}
        {activeSection === 'realizarCompra' && (
          <>
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-purple-600 mb-2">Realizar Compra</h1>
              <p className="text-gray-600 text-lg">Gestión de compras, proveedores y productos</p>
            </div>

            {/* Purchase Form */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-4">Información General de la Compra</h2>

                {/* Basic Info Row 1: Fecha & Número (Compacto) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                    <input type="date" value={compra.fecha} onChange={(e) => setCompra({ ...compra, fecha: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número de Compra (Automático)</label>
                    <input type="text" value={compra.numeroCompra} readOnly className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600" />
                  </div>
                </div>

                {/* Basic Info Row 2: Proveedor, Tipo & Factura (Alineados) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 items-end">
                  {/* Supplier - Takes 2 columns */}
                  <div className="md:col-span-2 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor</label>
                    <div className="flex space-x-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="Buscar proveedor..."
                          value={busquedaProveedor}
                          onChange={(e) => {
                            setBusquedaProveedor(e.target.value);
                            setMostrarResultadosProveedor(true);
                            if (compra.proveedorNombre && e.target.value !== compra.proveedorNombre) {
                              setCompra(prev => ({ ...prev, proveedorId: '', proveedorNombre: '' }));
                            }
                          }}
                          onFocus={() => setMostrarResultadosProveedor(true)}
                          onBlur={() => setTimeout(() => setMostrarResultadosProveedor(false), 200)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                        />
                        <div
                          className="absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer text-gray-500 hover:text-purple-600"
                          onClick={() => {
                            setMostrarResultadosProveedor(!mostrarResultadosProveedor);
                            // Focus input if opening
                            if (!mostrarResultadosProveedor) {
                              document.querySelector('input[placeholder="Buscar proveedor..."]').focus();
                            }
                          }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {mostrarResultadosProveedor && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto top-full left-0">
                          {proveedores
                            .filter(p =>
                              p.nombre.toLowerCase().includes(busquedaProveedor.toLowerCase()) ||
                              (p.nombreComercial && p.nombreComercial.toLowerCase().includes(busquedaProveedor.toLowerCase())) ||
                              (p.nit && p.nit.includes(busquedaProveedor))
                            )
                            .map(p => (
                              <div
                                key={p._id}
                                onMouseDown={() => seleccionarProveedor(p)}
                                className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors duration-150"
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-semibold text-gray-800">{p.nombre}</div>
                                    <div className="text-xs text-gray-500 font-medium">
                                      {[p.nombreComercial, p.nit].filter(Boolean).join(' - ')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          {proveedores.filter(p =>
                            p.nombre.toLowerCase().includes(busquedaProveedor.toLowerCase()) ||
                            (p.nombreComercial && p.nombreComercial.toLowerCase().includes(busquedaProveedor.toLowerCase())) ||
                            (p.nit && p.nit.includes(busquedaProveedor))
                          ).length === 0 && (
                              <div className="px-4 py-3 text-gray-500 text-center text-sm">
                                No se encontraron proveedores
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setShowProveedorForm(!showProveedorForm)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition whitespace-nowrap">
                      {showProveedorForm ? 'Cancelar' : '+ Crear Proveedor'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Compra</label>
                    <select value={compra.tipoCompra} onChange={(e) => setCompra({ ...compra, tipoCompra: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option value="Materia Prima">Materia Prima</option>
                      <option value="Producto Terminado">Producto Terminado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Factura <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={compra.numeroFactura}
                      onChange={(e) => setCompra({ ...compra, numeroFactura: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Ej: F-123456"
                      required
                    />
                  </div>
                </div>
                {compra.proveedorNombre && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <span className="text-sm text-green-800">✅ Proveedor seleccionado: <strong>{compra.proveedorNombre}</strong></span>
                  </div>
                )}
              </div>

              {/* New Supplier Form */}
              {showProveedorForm && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Nuevo Proveedor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Nombre del proveedor" value={nuevoProveedor.nombre} onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, nombre: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" />
                    <input type="text" placeholder="Nombre comercial" value={nuevoProveedor.nombreComercial} onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, nombreComercial: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" />
                    <input type="text" placeholder="NIT" value={nuevoProveedor.nit} onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, nit: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" />
                    <input type="text" placeholder="Ubicación" value={nuevoProveedor.ubicacion} onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, ubicacion: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" />
                    <input type="text" placeholder="Teléfono" value={nuevoProveedor.contacto.telefono} onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, contacto: { ...nuevoProveedor.contacto, telefono: e.target.value } })} className="px-4 py-2 border border-gray-300 rounded-lg" />
                    <input type="email" placeholder="Email" value={nuevoProveedor.contacto.email} onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, contacto: { ...nuevoProveedor.contacto, email: e.target.value } })} className="px-4 py-2 border border-gray-300 rounded-lg" />
                    <div className="md:col-span-2">
                      <input type="text" placeholder="Dirección" value={nuevoProveedor.direccion} onChange={(e) => setNuevoProveedor({ ...nuevoProveedor, direccion: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>

                    {/* Información Bancaria */}
                    <div className="md:col-span-2">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Información Bancaria</h4>
                      {nuevoProveedor.bancos.map((banco, index) => (
                        <div key={index} className="mb-4 p-3 bg-gray-50 rounded-lg border">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                            <input
                              type="text"
                              placeholder="Nombre del banco"
                              value={banco.nombre}
                              onChange={(e) => actualizarBanco(index, 'nombre', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg"
                            />
                            <input
                              type="text"
                              placeholder="Número de cuenta"
                              value={banco.numeroCuenta}
                              onChange={(e) => actualizarBanco(index, 'numeroCuenta', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg"
                            />
                            <div className="flex items-center space-x-2">
                              {nuevoProveedor.bancos.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => eliminarBanco(index)}
                                  className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={agregarBanco}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                      >
                        + Agregar Banco
                      </button>
                    </div>

                    <div className="md:col-span-2 flex space-x-4">
                      <button onClick={handleCrearProveedor} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Guardar</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Observations */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                <textarea value={compra.observaciones} onChange={(e) => setCompra({ ...compra, observaciones: e.target.value })} placeholder="Ej: El proveedor enviará la mercadería una vez se cancele el saldo." rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              {/* --- Products Section --- */}
              <div className="border-t pt-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Productos de la Compra</h2>

                {/* Search and Add Product */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">Buscar y Agregar Producto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                    <div className="md:col-span-2 relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Buscar Producto</label>
                      <input type="text" placeholder="Buscar por nombre o código..." value={busquedaProducto} onChange={(e) => setBusquedaProducto(e.target.value)} onFocus={() => busquedaProducto && setMostrarResultadosProducto(true)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                      {mostrarResultadosProducto && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {productosFiltrados.length > 0 ? productosFiltrados.map(p => (
                            <div key={p._id} onMouseDown={() => seleccionarProducto(p)} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                              <div className="font-semibold text-gray-800">{p.nombre}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Código:</span> {p.codigo || 'N/A'}
                                {p.color && <> <span className="mx-2">•</span> <span className="font-medium">Color:</span> {p.color}</>}
                              </div>
                              <div className="text-sm text-gray-600">
                                {p.marca && <><span className="font-medium">Marca:</span> {p.marca} <span className="mx-2">•</span></>}
                                <span className="font-medium">Categoría:</span> {p.categoria}
                              </div>
                            </div>
                          )) : <div className="px-4 py-3 text-gray-500 text-center">No se encontraron productos</div>}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                      <input type="number" placeholder="Cantidad" value={productoTemporal.cantidad || ''} onChange={(e) => setProductoTemporal({ ...productoTemporal, cantidad: e.target.value === '' ? '' : parseInt(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Costo"
                        value={productoTemporal.costoUnitario || ''}
                        onChange={(e) => setProductoTemporal({ ...productoTemporal, costoUnitario: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                        onFocus={(e) => e.target.select()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  {productoTemporal.productoNombre && (
                    <div className="mb-4 p-2 bg-blue-100 border border-blue-200 rounded">
                      <span className="text-sm text-blue-800">✅ Producto: <strong>{productoTemporal.productoNombre}</strong></span>
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <button onClick={agregarProductoACompra} disabled={!productoTemporal.productoId} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                      Agregar Producto a la Compra
                    </button>
                    <button onClick={() => setShowProductoForm(!showProductoForm)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
                      {showProductoForm ? 'Cancelar' : '+ Crear Nuevo Producto'}
                    </button>
                  </div>
                </div>

                {/* New Product Form */}
                {showProductoForm && (
                  <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <h3 className="text-lg font-semibold text-teal-800 mb-4">Crear Nuevo Producto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Nombre del producto" value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg" />
                      <input type="text" placeholder="Código del producto" value={nuevoProducto.codigo} onChange={(e) => { const val = e.target.value; setNuevoProducto(prev => ({ ...prev, codigo: val })); }} className="px-4 py-2 border border-gray-300 rounded-lg" />

                      {/* Selector de Tipo de Producto */}
                      <select
                        value={nuevoProducto.tipo}
                        onChange={(e) => { const val = e.target.value; setNuevoProducto(prev => ({ ...prev, tipo: val })); }}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="Producto Terminado">Producto Terminado</option>
                        <option value="Materia Prima">Materia Prima</option>
                      </select>

                      {/* Combo Box de Categoría */}
                      <div className="relative">
                        <div className="relative w-full">
                          <input
                            type="text"
                            placeholder="Buscar o crear categoría..."
                            value={nuevoProducto.categoria === 'nueva' ? nuevoProducto.nuevaCategoria : nuevoProducto.categoria}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNuevoProducto(prev => ({ ...prev, categoria: val, nuevaCategoria: val }));
                              setMostrarResultadosCategoria(true);
                            }}
                            onBlur={() => setTimeout(() => setMostrarResultadosCategoria(false), 200)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 pr-10"
                          />
                          <div
                            className="absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer text-gray-500 hover:text-teal-600"
                            onClick={() => {
                              setMostrarResultadosCategoria(!mostrarResultadosCategoria);
                              if (!mostrarResultadosCategoria) {
                                document.querySelector('input[placeholder="Buscar o crear categoría..."]').focus();
                              }
                            }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {mostrarResultadosCategoria && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                            {categorias
                              .filter(cat => cat.toLowerCase().includes((nuevoProducto.categoria === 'nueva' ? nuevoProducto.nuevaCategoria : nuevoProducto.categoria).toLowerCase()))
                              .map(cat => (
                                <div
                                  key={cat}
                                  onMouseDown={() => setNuevoProducto(prev => ({ ...prev, categoria: cat, nuevaCategoria: cat }))}
                                  className="px-4 py-2 hover:bg-teal-50 cursor-pointer border-b border-gray-100 last:border-0 text-gray-700"
                                >
                                  {cat}
                                </div>
                              ))}
                            {categorias.filter(cat => cat.toLowerCase().includes((nuevoProducto.categoria === 'nueva' ? nuevoProducto.nuevaCategoria : nuevoProducto.categoria).toLowerCase())).length === 0 && (
                              <div className="px-4 py-2 text-gray-500 text-sm italic">
                                Presiona Enter o guarda para crear "{nuevoProducto.categoria === 'nueva' ? nuevoProducto.nuevaCategoria : nuevoProducto.categoria}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <input type="text" placeholder="Color" value={nuevoProducto.color} onChange={(e) => { const val = e.target.value; setNuevoProducto(prev => ({ ...prev, color: val })); }} className="px-4 py-2 border border-gray-300 rounded-lg" />
                      <input type="text" placeholder="Marca" value={nuevoProducto.marca} onChange={(e) => { const val = e.target.value; setNuevoProducto(prev => ({ ...prev, marca: val })); }} className="px-4 py-2 border border-gray-300 rounded-lg" />
                      <input type="text" placeholder="Cajas (Ej: 1 caja 2 sillas)" value={nuevoProducto.cajas} onChange={(e) => { const val = e.target.value; setNuevoProducto(prev => ({ ...prev, cajas: val })); }} className="px-4 py-2 border border-gray-300 rounded-lg" />

                      <input type="number" step="0.01" placeholder="Alto (cm)" value={nuevoProducto.dimensiones.alto || ''} onChange={(e) => { const val = e.target.value; setNuevoProducto(prev => ({ ...prev, dimensiones: { ...prev.dimensiones, alto: val } })); }} className="px-4 py-2 border border-gray-300 rounded-lg" />
                      <input type="number" step="0.01" placeholder="Ancho (cm)" value={nuevoProducto.dimensiones.ancho || ''} onChange={(e) => { const val = e.target.value; setNuevoProducto(prev => ({ ...prev, dimensiones: { ...prev.dimensiones, ancho: val } })); }} className="px-4 py-2 border border-gray-300 rounded-lg" />
                      <input type="number" step="0.01" placeholder="Profundidad (cm)" value={nuevoProducto.dimensiones.profundidad || ''} onChange={(e) => { const val = e.target.value; setNuevoProducto(prev => ({ ...prev, dimensiones: { ...prev.dimensiones, profundidad: val } })); }} className="px-4 py-2 border border-gray-300 rounded-lg" />

                      <input type="text" placeholder="Almacén" value={nuevoProducto.ubicacion} onChange={(e) => { const val = e.target.value; setNuevoProducto(prev => ({ ...prev, ubicacion: val })); }} className="px-4 py-2 border border-gray-300 rounded-lg" />
                      <select value={nuevoProducto.proveedor} onChange={(e) => { const val = e.target.value; setNuevoProducto(prev => ({ ...prev, proveedor: val })); }} className="px-4 py-2 border border-gray-300 rounded-lg">
                        <option value="">-- Seleccionar Proveedor --</option>
                        {proveedores.map(p => <option key={p._id} value={p._id}>{p.nombre}</option>)}
                      </select>

                      <textarea
                        placeholder="Descripción del producto"
                        value={nuevoProducto.descripcion}
                        onChange={(e) => { const val = e.target.value; setNuevoProducto(prev => ({ ...prev, descripcion: val })); }}
                        className="px-4 py-2 border border-gray-300 rounded-lg md:col-span-2"
                        rows="2"
                      />

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Producto</label>
                        <input
                          type="file"
                          onChange={(e) => setSelectedImageFile(e.target.files[0])}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          accept="image/*"
                        />
                      </div>
                      <div className="md:col-span-2 flex space-x-4">
                        <button onClick={handleCrearProducto} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700">Guardar Producto</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Products in Purchase Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left py-3 px-4">Producto</th>
                        <th className="text-left py-3 px-4">Código</th>
                        <th className="text-left py-3 px-4">Color</th>
                        <th className="text-right py-3 px-4">Cantidad</th>
                        <th className="text-right py-3 px-4">Costo Unit.</th>
                        <th className="text-right py-3 px-4">Costo Total</th>
                        <th className="text-center py-3 px-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compra.productos.map((p, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-4">{p.nombre}</td>
                          <td className="py-3 px-4">{p.codigo}</td>
                          <td className="py-3 px-4">{p.color}</td>
                          <td className="text-right py-3 px-4">{p.cantidad}</td>
                          <td className="text-right py-3 px-4">Bs. {p.costoUnitario.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">Bs {p.costoTotal.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => eliminarProductoDeCompra(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar producto"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* --- Totals and Payment Section --- */}
                <div className="border-t pt-6 mt-6">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Pago y Confirmación</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Payment Methods */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Métodos de Pago</h3>
                        <button onClick={agregarPago} className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 font-medium">
                          + Agregar Método
                        </button>
                      </div>

                      <div className="space-y-3">
                        {listaPagos.length === 0 && (
                          <p className="text-gray-500 italic text-sm">No hay pagos registrados. Se considerará como deuda total.</p>
                        )}
                        {listaPagos.map((pago) => (
                          <div key={pago.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 relative">
                            <button onClick={() => eliminarPago(pago.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                              ✕
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                                <select value={pago.tipo} onChange={(e) => actualizarPago(pago.id, 'tipo', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                  <option value="Efectivo">Efectivo</option>
                                  <option value="Transferencia">Transferencia</option>
                                  <option value="Cheque">Cheque</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                                <input type="number" step="0.01" value={pago.monto} onChange={(e) => actualizarPago(pago.id, 'monto', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="0.00" />
                              </div>
                            </div>

                            {/* Bank Account / Cash Box Selector */}
                            {pago.tipo !== 'Crédito' && (
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {pago.tipo === 'Efectivo' ? 'Caja de Origen' : 'Cuenta Bancaria de Origen'}
                                </label>
                                <select
                                  value={pago.cuentaId || ''}
                                  onChange={(e) => actualizarPago(pago.id, 'cuentaId', e.target.value)}
                                  className={`w-full px-3 py-2 border rounded-lg ${pago.tipo === 'Efectivo' ? 'border-green-300 bg-green-50' : 'border-blue-300 bg-blue-50'}`}
                                >
                                  <option value="">-- Seleccionar {pago.tipo === 'Efectivo' ? 'Caja' : 'Cuenta'} --</option>
                                  {bankAccounts
                                    .filter(acc => acc.isActive && (pago.tipo === 'Efectivo' ? acc.tipo === 'efectivo' : acc.tipo === 'banco'))
                                    .map(acc => (
                                      <option key={acc._id} value={acc._id}>
                                        {acc.nombreBanco} - {acc.numeroCuenta} (Saldo: Bs. {acc.saldo.toFixed(2)})
                                      </option>
                                    ))}
                                </select>
                                {pago.cuentaId && (
                                  <div className="mt-1 text-xs">
                                    {(() => {
                                      const acc = bankAccounts.find(a => a._id === pago.cuentaId);
                                      if (acc) {
                                        const saldoInsuficiente = parseFloat(pago.monto || 0) > acc.saldo;
                                        return (
                                          <span className={saldoInsuficiente ? 'text-red-600 font-bold' : 'text-green-600'}>
                                            Saldo disponible: Bs. {acc.saldo.toFixed(2)}
                                            {saldoInsuficiente && ' (Fondos Insuficientes)'}
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Additional fields for Cheque */}
                            {pago.tipo === 'Cheque' && (
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cheque / Banco</label>
                                <input type="text" value={pago.cuenta} onChange={(e) => actualizarPago(pago.id, 'cuenta', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ej: Cheque #123456 - BNB" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Resumen de Saldos */}
                      <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-600">Total Compra:</span>
                          <span className="font-bold text-lg">Bs. {totalCompra.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-green-600">Total Pagado:</span>
                          <span className="font-bold text-green-600">Bs. {totalPagado.toFixed(2)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between items-center">
                          <span className="text-red-600 font-semibold">Saldo Pendiente:</span>
                          <span className="font-bold text-xl text-red-600">Bs. {saldoPendiente.toFixed(2)}</span>
                        </div>
                      </div>

                      {listaPagos.some(p => p.tipo === 'Cheque') && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Imagen del Cheque</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setChequeImage(e.target.files[0])}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                    <h3 className="text-xl font-bold text-purple-800 mb-4">Resumen de la Compra</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-700">Subtotal:</span>
                        <span className="font-semibold text-gray-800">Bs. {totalCompra.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-gray-700">Total Pagado:</span>
                        <span className="font-semibold text-green-600">Bs. {totalPagado.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold border-t pt-3 mt-3">
                        <span className="text-purple-800">Saldo Pendiente:</span>
                        <span className="text-red-600">Bs. {(totalCompra - totalPagado).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="mt-6">
                      <button
                        onClick={confirmarCompra}
                        disabled={compra.productos.length === 0 || totalPagado > totalCompra}
                        className="w-full bg-purple-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Confirmar y Registrar Compra
                      </button>
                      {totalPagado > totalCompra && (
                        <p className="text-red-500 text-sm mt-2 text-center">El total pagado no puede ser mayor al total de la compra.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- SECCIÓN GESTIÓN DE PROVEEDORES --- */}
        {activeSection === 'proveedores' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Directorio de Proveedores</h2>
              <button
                onClick={() => {
                  setSupplierEditing(null); // Modo crear
                  setSupplierFormData({
                    nombre: '', nombreComercial: '', contacto: { telefono: '', email: '' }, direccion: '', ubicacion: '', ciudad: '', nit: '', bancos: []
                  });
                  setShowSupplierForm(true);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
              >
                <span>+</span> Nuevo Proveedor
              </button>
            </div>

            {/* Modal para Crear/Editar Proveedor */}
            {showSupplierForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800">
                      {supplierEditing ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
                    </h3>
                    <button
                      onClick={() => setShowSupplierForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Empresa *</label>
                        <input
                          type="text"
                          value={supplierFormData.nombre}
                          onChange={(e) => setSupplierFormData({ ...supplierFormData, nombre: e.target.value })}
                          className={`w-full p-2 border ${supplierErrors.nombre ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                          placeholder="Nombre del proveedor"
                        />
                        {supplierErrors.nombre && <p className="text-red-500 text-xs mt-1">{supplierErrors.nombre}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
                        <input
                          type="text"
                          value={supplierFormData.nombreComercial}
                          onChange={(e) => setSupplierFormData({ ...supplierFormData, nombreComercial: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="Nombre comercial"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
                        <input
                          type="text"
                          value={supplierFormData.nit}
                          onChange={(e) => setSupplierFormData({ ...supplierFormData, nit: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="NIT"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                        <input
                          type="text"
                          value={supplierFormData.ubicacion}
                          onChange={(e) => setSupplierFormData({ ...supplierFormData, ubicacion: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="Ubicación"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input
                          type="text"
                          value={supplierFormData.contacto.telefono}
                          onChange={(e) => setSupplierFormData({ ...supplierFormData, contacto: { ...supplierFormData.contacto, telefono: e.target.value } })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="Teléfono"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={supplierFormData.contacto.email}
                          onChange={(e) => setSupplierFormData({ ...supplierFormData, contacto: { ...supplierFormData.contacto, email: e.target.value } })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="Email"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                        <input
                          type="text"
                          value={supplierFormData.direccion}
                          onChange={(e) => setSupplierFormData({ ...supplierFormData, direccion: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          placeholder="Dirección"
                        />
                      </div>

                      {/* Sección Bancos */}
                      <div className="md:col-span-2 mt-4">
                        <h4 className="text-md font-semibold text-gray-800 mb-3">Información Bancaria</h4>
                        {supplierFormData.bancos && supplierFormData.bancos.map((banco, index) => (
                          <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg border flex flex-col md:flex-row gap-3 items-end">
                            <div className="flex-1 w-full">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Banco</label>
                              <input
                                type="text"
                                value={banco.nombre}
                                onChange={(e) => updateBankInForm(index, 'nombre', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="Nombre del banco"
                              />
                            </div>
                            <div className="flex-1 w-full">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Nro. Cuenta</label>
                              <input
                                type="text"
                                value={banco.numeroCuenta}
                                onChange={(e) => updateBankInForm(index, 'numeroCuenta', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="Número de cuenta"
                              />
                            </div>
                            <button
                              onClick={() => removeBankFromForm(index)}
                              className="p-2 text-red-500 hover:text-red-700 bg-red-50 rounded-lg"
                              title="Eliminar banco"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={addBankToForm}
                          className="text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 font-medium"
                        >
                          + Agregar Banco
                        </button>
                      </div>

                    </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 rounded-b-xl">
                    <button
                      onClick={() => setShowSupplierForm(false)}
                      className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveSupplier}
                      className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 shadow-md transition-colors"
                    >
                      {supplierEditing ? 'Actualizar' : 'Guardar'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de Proveedores */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">Proveedor / Empresa</th>
                    <th className="px-6 py-3">Contacto Principal</th>
                    <th className="px-6 py-3">Datos de Contacto</th>
                    <th className="px-6 py-3">Ubicación</th>
                    <th className="px-6 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {proveedores.map(proveedor => (
                    <tr key={proveedor._id} className="bg-white hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{proveedor.nombre}</div>
                        {proveedor.nit && <div className="text-xs text-purple-600">NIT: {proveedor.nit}</div>}
                      </td>
                      <td className="px-6 py-4">
                        {proveedor.nombreComercial || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {proveedor.contacto?.telefono && <span className="flex items-center gap-1">📞 {proveedor.contacto.telefono}</span>}
                          {proveedor.contacto?.email && <span className="flex items-center gap-1 text-xs">✉️ {proveedor.contacto.email}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {proveedor.direccion}
                        {proveedor.ciudad && <div className="text-xs text-gray-500">{proveedor.ciudad}</div>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditProveedor(proveedor)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button
                            onClick={() => handleDeleteProveedor(proveedor._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {proveedores.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                        No hay proveedores registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- SECCIÓN HISTORIAL --- */}
        {activeSection === 'historial' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Historial de Compras</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">Número / Fecha</th>
                    <th className="px-6 py-3">Proveedor</th>
                    <th className="px-6 py-3">Productos</th>
                    <th className="px-6 py-3">Total</th>
                    <th className="px-6 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historialCompras.map(compra => (
                    <tr key={compra._id} className="bg-white hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{compra.numCompra || compra._id}</div>
                        <div className="text-xs text-gray-500">{new Date(compra.fecha).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        {compra.proveedor?.nombre || ' - '}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {compra.productos.map((prod, idx) => (
                            <span key={idx} className="text-xs">{prod.cantidad} x {prod.nombreProducto || 'Item'}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        Bs. {compra.totalCompra ? compra.totalCompra.toFixed(2) : '0.00'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                          {/* Botón Ver Detalles */}
                          <button
                            onClick={() => verDetallesCompra(compra)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver Detalles"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          {/* Botón Exportar PDF */}
                          <button
                            onClick={() => exportarCompraPDF(compra)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Exportar PDF"
                          >
                            <span>📄</span>
                          </button>
                          {/* Botón Eliminar */}
                          <button
                            onClick={() => handleEliminarCompra(compra._id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar Compra (Revierte Inventario y Finanzas)"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* --- MODAL DE DETALLES DE COMPRA --- */}
            {showDetailModal && selectedCompra && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">Detalles de Compra #{selectedCompra.numCompra || selectedCompra._id}</h3>
                      <p className="text-sm text-gray-500">Fecha: {new Date(selectedCompra.fecha).toLocaleDateString('es-ES')}</p>
                    </div>
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-2 transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Info Proveedor y Estado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-purple-50 p-4 rounded-lg border border-purple-100">
                      <div>
                        <h4 className="font-semibold text-purple-800 mb-2">Información del Proveedor</h4>
                        {selectedCompra.proveedor ? (
                          <ul className="text-sm text-gray-700 space-y-1">
                            <li><span className="font-medium">Nombre:</span> {selectedCompra.proveedor.nombre}</li>
                            {selectedCompra.proveedor.nit && <li><span className="font-medium">NIT:</span> {selectedCompra.proveedor.nit}</li>}
                            {selectedCompra.proveedor.contacto?.telefono && <li><span className="font-medium">Teléfono:</span> {selectedCompra.proveedor.contacto.telefono}</li>}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Proveedor no especificado</p>
                        )}
                      </div>
                      <div className="text-right">
                        <h4 className="font-semibold text-gray-800 mb-2">Estado de Compra</h4>
                        <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${selectedCompra.estado === 'Pagada'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {selectedCompra.estado}
                        </span>
                        <div className="mt-2 text-sm text-gray-600">
                          <p>Tipo: <span className="font-bold">{selectedCompra.tipoCompra}</span></p>
                          <p>Factura: <span className="font-mono font-medium">{selectedCompra.numeroFactura || '-'}</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Tabla de Productos */}
                    <div>
                      <h4 className="font-bold text-gray-800 mb-3 text-lg border-b pb-2">Productos Comprados</h4>
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 text-gray-700">
                            <tr>
                              <th className="px-4 py-2 text-left">Producto</th>
                              <th className="px-4 py-2 text-left">Código</th>
                              <th className="px-4 py-2 text-center">Color</th>
                              <th className="px-4 py-2 text-center">Cant.</th>
                              <th className="px-4 py-2 text-right">Costo Unit.</th>
                              <th className="px-4 py-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedCompra.productos.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-2 font-medium text-gray-900">{item.nombreProducto}</td>
                                <td className="px-4 py-2 font-mono text-gray-500">{item.codigo || '-'}</td>
                                <td className="px-4 py-2 text-center text-gray-600">{item.colorProducto || '-'}</td>
                                <td className="px-4 py-2 text-center font-semibold">{item.cantidad}</td>
                                <td className="px-4 py-2 text-right">Bs. {item.precioUnitario.toFixed(2)}</td>
                                <td className="px-4 py-2 text-right font-medium text-purple-600">Bs. {(item.cantidad * item.precioUnitario).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50 font-semibold">
                            <tr>
                              <td colSpan="5" className="px-4 py-3 text-right text-gray-900 font-bold text-lg">Total Compra:</td>
                              <td className="px-4 py-3 text-right text-lg text-purple-700 font-bold">
                                Bs. {selectedCompra.totalCompra.toFixed(2)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Pagos y Observaciones */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-bold text-gray-800 mb-2 border-b pb-1">Observaciones</h4>
                        <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg border min-h-[80px]">
                          {selectedCompra.observaciones || "Sin observaciones adicionales."}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 mb-2 border-b pb-1">Desglose de Pagos</h4>
                        <div className="space-y-2">
                          {selectedCompra.metodosPago?.map((pago, idx) => {
                            let cuentaInfo = "";
                            if (pago.cuentaId) {
                              const cuenta = bankAccounts.find(acc => acc._id === pago.cuentaId);
                              if (cuenta) {
                                cuentaInfo = ` (Desde ${cuenta.nombreBanco})`;
                              }
                            } else if (pago.cuenta) {
                              cuentaInfo = ` (${pago.cuenta})`;
                            }
                            return (
                              <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded border border-gray-100">
                                <span className="font-medium">{pago.tipo}{cuentaInfo}:</span>
                                <span className="font-bold text-gray-900">Bs. {pago.monto.toFixed(2)}</span>
                              </div>
                            );
                          })}
                          <div className="border-t pt-2 flex justify-between font-bold text-gray-900 mt-2">
                            <span>Total Pagado:</span>
                            <span>Bs. {(selectedCompra.metodosPago?.filter(p => p.tipo !== 'Crédito').reduce((acc, curr) => acc + curr.monto, 0) || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-red-600 font-bold">
                            <span>Saldo Pendiente:</span>
                            <span>Bs. {(selectedCompra.saldoPendiente || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                    <button
                      onClick={() => exportarCompraPDF(selectedCompra)}
                      className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 shadow transition-colors flex items-center gap-2"
                    >
                      <span>📄</span> Exportar PDF
                    </button>
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 shadow transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div >
  );
};

export default ComprasPage;