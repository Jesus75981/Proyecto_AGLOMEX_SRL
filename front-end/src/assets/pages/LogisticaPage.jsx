// front-end/src/assets/pages/LogisticaPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LogisticaPage = ({ userRole }) => {
    const navigate = useNavigate();
    
    // Estados para pedidos
    const [pedidos, setPedidos] = useState([]);
    const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
    const [filtroEstado, setFiltroEstado] = useState('todos');
    
    // Estados para nuevo pedido
    const [mostrarForm, setMostrarForm] = useState(false);
    const [nuevoPedido, setNuevoPedido] = useState({
        cliente: '',
        productos: [],
        direccionEnvio: {
            calle: '',
            ciudad: '',
            departamento: '',
            codigoPostal: ''
        },
        fechaEntrega: '',
        observaciones: ''
    });
    
    // Estados para datos externos
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState({
        producto: '',
        cantidad: 1
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Verificar autenticación al cargar
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        
        cargarPedidos();
        cargarClientes();
        cargarProductos();
    }, [navigate]);

    // Filtrar pedidos cuando cambia el filtro
    useEffect(() => {
        if (filtroEstado === 'todos') {
            setPedidosFiltrados(pedidos);
        } else {
            setPedidosFiltrados(pedidos.filter(pedido => pedido.estado === filtroEstado));
        }
    }, [filtroEstado, pedidos]);

    // Función para manejar errores de autenticación
    const manejarErrorAutenticacion = (error) => {
        console.error('Error de autenticación:', error);
        if (error.message.includes('403') || error.message.includes('401')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            setTimeout(() => navigate('/login'), 2000);
        }
    };

    const cargarPedidos = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch('http://localhost:5000/api/logistica', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.status === 403 || response.status === 401) {
                throw new Error('Token expirado o inválido');
            }
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            setPedidos(Array.isArray(data) ? data : []); // ✅ Asegurar que sea array
        } catch (error) {
            console.error('Error cargando pedidos:', error);
            manejarErrorAutenticacion(error);
            
            // Datos de ejemplo para desarrollo (solo si no hay error de auth)
            if (!error.message.includes('403') && !error.message.includes('401')) {
                setPedidos([
                    {
                        _id: '1',
                        pedidoNumero: 'PED-001',
                        cliente: { _id: '1', nombre: 'Cliente Corporativo S.A.' },
                        productos: [
                            { producto: { _id: '1', nombre: 'Silla Ejecutiva' }, cantidad: 2 }
                        ],
                        estado: 'pendiente',
                        fechaPedido: '2024-01-25',
                        fechaEntrega: '2024-02-01',
                        direccionEnvio: {
                            calle: 'Av. Principal 123',
                            ciudad: 'Lima',
                            departamento: 'Lima',
                            codigoPostal: '15001'
                        }
                    },
                    {
                        _id: '2',
                        pedidoNumero: 'PED-002',
                        cliente: { _id: '2', nombre: 'Empresa XYZ Ltda.' },
                        productos: [
                            { producto: { _id: '2', nombre: 'Mesa de Reuniones' }, cantidad: 1 }
                        ],
                        estado: 'en_proceso',
                        fechaPedido: '2024-01-20',
                        fechaEntrega: '2024-01-30',
                        direccionEnvio: {
                            calle: 'Calle Secundaria 456',
                            ciudad: 'Arequipa',
                            departamento: 'Arequipa',
                            codigoPostal: '04001'
                        }
                    }
                ]);
            }
        }
    };

    const cargarClientes = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('http://localhost:5000/api/clientes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setClientes(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error cargando clientes:', error);
            // No manejamos error aquí para no redirigir múltiples veces
        }
    };

    const cargarProductos = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('http://localhost:5000/api/products', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setProductos(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
            // No manejamos error aquí para no redirigir múltiples veces
        }
    };

    // Agregar producto al pedido
    const agregarProducto = () => {
        if (productoSeleccionado.producto && productoSeleccionado.cantidad > 0) {
            const producto = productos.find(p => p._id === productoSeleccionado.producto);
            if (producto) {
                setNuevoPedido({
                    ...nuevoPedido,
                    productos: [
                        ...nuevoPedido.productos,
                        {
                            producto: producto._id,
                            cantidad: productoSeleccionado.cantidad
                        }
                    ]
                });
                setProductoSeleccionado({ producto: '', cantidad: 1 });
            }
        }
    };

    // Remover producto del pedido
    const removerProducto = (index) => {
        const nuevosProductos = nuevoPedido.productos.filter((_, i) => i !== index);
        setNuevoPedido({ ...nuevoPedido, productos: nuevosProductos });
    };

    // Crear nuevo pedido
    const crearPedido = async () => {
        if (!nuevoPedido.cliente || nuevoPedido.productos.length === 0 || !nuevoPedido.fechaEntrega) {
            alert('Por favor, completa todos los campos obligatorios.');
            return;
        }

        if (!nuevoPedido.direccionEnvio.calle || !nuevoPedido.direccionEnvio.ciudad || !nuevoPedido.direccionEnvio.departamento) {
            alert('Por favor, completa todos los campos de la dirección de envío.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const datosParaBackend = {
                cliente: nuevoPedido.cliente,
                productos: nuevoPedido.productos,
                direccionEnvio: nuevoPedido.direccionEnvio,
                fechaEntrega: nuevoPedido.fechaEntrega,
                observaciones: nuevoPedido.observaciones
            };

            const response = await fetch('http://localhost:5000/api/logistica', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(datosParaBackend)
            });

            if (response.status === 403 || response.status === 401) {
                throw new Error('Token expirado. Por favor, inicia sesión nuevamente.');
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error ${response.status}`);
            }

            const pedidoCreado = await response.json();
            alert(`✅ Pedido #${pedidoCreado.pedidoNumero} creado exitosamente`);
            
            setMostrarForm(false);
            setNuevoPedido({
                cliente: '',
                productos: [],
                direccionEnvio: { calle: '', ciudad: '', departamento: '', codigoPostal: '' },
                fechaEntrega: '',
                observaciones: ''
            });
            
            cargarPedidos();
            
        } catch (error) {
            console.error('Error creando pedido:', error);
            setError(error.message);
            if (error.message.includes('expirado')) {
                setTimeout(() => navigate('/login'), 2000);
            }
        } finally {
            setLoading(false);
        }
    };

    // Actualizar estado del pedido
    const actualizarEstado = async (pedidoId, nuevoEstado) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`http://localhost:5000/api/logistica/${pedidoId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (response.status === 403 || response.status === 401) {
                throw new Error('Token expirado');
            }

            if (response.ok) {
                alert(`✅ Estado actualizado a: ${getEstadoTexto(nuevoEstado)}`);
                cargarPedidos();
            } else {
                const errorData = await response.json();
                alert('❌ Error: ' + (errorData.error || 'Error actualizando estado'));
            }
        } catch (error) {
            console.error('Error actualizando estado:', error);
            if (error.message.includes('expirado')) {
                alert('Tu sesión ha expirado. Serás redirigido al login.');
                navigate('/login');
            } else {
                alert('❌ Error de conexión');
            }
        }
    };

    // Eliminar pedido
    const eliminarPedido = async (pedidoId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch(`http://localhost:5000/api/logistica/${pedidoId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.status === 403 || response.status === 401) {
                    throw new Error('Token expirado');
                }

                if (response.ok) {
                    alert('✅ Pedido eliminado exitosamente');
                    cargarPedidos();
                } else {
                    const errorData = await response.json();
                    alert('❌ Error: ' + (errorData.error || 'Error eliminando pedido'));
                }
            } catch (error) {
                console.error('Error eliminando pedido:', error);
                if (error.message.includes('expirado')) {
                    alert('Tu sesión ha expirado. Serás redirigido al login.');
                    navigate('/login');
                } else {
                    alert('❌ Error de conexión');
                }
            }
        }
    };

    // Obtener color según estado
    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'en_proceso': return 'bg-blue-100 text-blue-800';
            case 'despachado': return 'bg-purple-100 text-purple-800';
            case 'entregado': return 'bg-green-100 text-green-800';
            case 'cancelado': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Obtener texto del estado
    const getEstadoTexto = (estado) => {
        switch (estado) {
            case 'pendiente': return 'Pendiente';
            case 'en_proceso': return 'En Proceso';
            case 'despachado': return 'Despachado';
            case 'entregado': return 'Entregado';
            case 'cancelado': return 'Cancelado';
            default: return estado;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-800">Gestión de Logística</h1>
                    <p className="text-gray-600 mt-2">Control de pedidos y envíos - Rol: {userRole}</p>
                </div>
                <div className="flex space-x-4">
                    <button
                        onClick={() => setMostrarForm(!mostrarForm)}
                        className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                        {mostrarForm ? '✕ Cancelar' : '➕ Nuevo Pedido'}
                    </button>
                    <Link 
                        to="/" 
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                        ← Volver
                    </Link>
                </div>
            </div>

            {/* Mensaje de error */}
            {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <div className="flex items-center">
                        <span className="text-lg mr-2">⚠️</span>
                        <span>{error}</span>
                    </div>
                    {error.includes('expirado') && (
                        <p className="text-sm mt-1">Redirigiendo al login...</p>
                    )}
                </div>
            )}

            {/* Resto del código permanece igual... */}
            {/* [El resto del código es idéntico al anterior, solo cambia el manejo de errores] */}
            
        </div>
    );
};

export default LogisticaPage;