// front-end/src/assets/pages/VentasPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const VentasPage = ({ userRole }) => {
    // Estados principales
    const [fechaVenta, setFechaVenta] = useState(new Date().toISOString().substring(0, 10));
    const [cliente, setCliente] = useState('');
    const [numFactura, setNumFactura] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [productos, setProductos] = useState([]);
    const [nuevoProducto, setNuevoProducto] = useState({ 
        codigo: '', 
        nombre: '', 
        cantidad: 1, 
        precioUnitario: 0 
    });
    const [total, setTotal] = useState(0);
    
    // Estados para datos externos
    const [clientes, setClientes] = useState([]);
    const [productosDisponibles, setProductosDisponibles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mostrarFormProducto, setMostrarFormProducto] = useState(false);

    // Cargar clientes y productos al iniciar
    useEffect(() => {
        cargarClientes();
        cargarProductos();
        generarNumeroFactura();
    }, []);

    // Recalcular total cuando cambian los productos
    useEffect(() => {
        const nuevoTotal = productos.reduce((sum, producto) => sum + producto.costoTotal, 0);
        setTotal(nuevoTotal);
    }, [productos]);

    const cargarClientes = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/clientes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setClientes(data);
        } catch (error) {
            console.error('Error cargando clientes:', error);
        }
    };

    const cargarProductos = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/products', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setProductosDisponibles(data);
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    };

    const generarNumeroFactura = () => {
        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 1000);
        setNumFactura(`FACT-${timestamp}-${random}`);
    };

    // Agregar producto desde el inventario
    const handleAddProductFromInventory = (productoId) => {
        const producto = productosDisponibles.find(p => p._id === productoId);
        if (producto) {
            const productoExistente = productos.find(p => p.codigo === producto.idProductoTienda);
            
            if (productoExistente) {
                // Si ya existe, aumentar cantidad
                const nuevosProductos = productos.map(p =>
                    p.codigo === producto.idProductoTienda
                        ? { ...p, cantidad: p.cantidad + 1, costoTotal: (p.cantidad + 1) * p.precioUnitario }
                        : p
                );
                setProductos(nuevosProductos);
            } else {
                // Si no existe, agregar nuevo
                const nuevoProductoItem = {
                    codigo: producto.idProductoTienda,
                    nombre: producto.nombre,
                    cantidad: 1,
                    precioUnitario: producto.precioVenta,
                    costoTotal: producto.precioVenta
                };
                setProductos([...productos, nuevoProductoItem]);
            }
        }
    };

    // Agregar producto personalizado
    const handleAddCustomProduct = () => {
        if (nuevoProducto.codigo && nuevoProducto.nombre && nuevoProducto.cantidad > 0 && nuevoProducto.precioUnitario > 0) {
            const costoTotalProducto = nuevoProducto.cantidad * nuevoProducto.precioUnitario;
            const productoExistente = productos.find(p => p.codigo === nuevoProducto.codigo);
            
            if (productoExistente) {
                // Actualizar producto existente
                const nuevosProductos = productos.map(p =>
                    p.codigo === nuevoProducto.codigo
                        ? { 
                            ...p, 
                            cantidad: p.cantidad + nuevoProducto.cantidad, 
                            costoTotal: (p.cantidad + nuevoProducto.cantidad) * p.precioUnitario 
                        }
                        : p
                );
                setProductos(nuevosProductos);
            } else {
                // Agregar nuevo producto
                setProductos([...productos, { 
                    ...nuevoProducto, 
                    costoTotal: costoTotalProducto 
                }]);
            }
            
            // Reset form
            setNuevoProducto({ codigo: '', nombre: '', cantidad: 1, precioUnitario: 0 });
            setMostrarFormProducto(false);
        } else {
            alert('Por favor, completa todos los campos del producto.');
        }
    };

    const handleRemoveProduct = (index) => {
        const newProducts = productos.filter((_, i) => i !== index);
        setProductos(newProducts);
    };

    const handleUpdateProductQuantity = (index, nuevaCantidad) => {
        if (nuevaCantidad < 1) return;
        
        const nuevosProductos = productos.map((producto, i) => 
            i === index 
                ? { 
                    ...producto, 
                    cantidad: nuevaCantidad, 
                    costoTotal: nuevaCantidad * producto.precioUnitario 
                }
                : producto
        );
        setProductos(nuevosProductos);
    };

    const handleRealizarVenta = async () => {
        if (!cliente || productos.length === 0) {
            alert('Por favor, selecciona un cliente y agrega al menos un producto.');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const ventaData = {
                fecha: fechaVenta,
                cliente: cliente,
                numeroFactura: numFactura,
                productos: productos.map(p => ({
                    codigo: p.codigo,
                    nombre: p.nombre,
                    cantidad: parseInt(p.cantidad),
                    precioUnitario: parseFloat(p.precioUnitario),
                    subtotal: parseFloat(p.costoTotal)
                })),
                observaciones,
                total: total
            };

            console.log('Enviando venta:', ventaData);

            const response = await fetch('http://localhost:5000/api/ventas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(ventaData)
            });

            if (response.ok) {
                const ventaGuardada = await response.json();
                alert(`✅ Venta realizada con éxito!\nNúmero: ${ventaGuardada.numero}\nTotal: $${total.toFixed(2)}`);
                
                // Reset form
                setCliente('');
                setProductos([]);
                setTotal(0);
                setObservaciones('');
                setFechaVenta(new Date().toISOString().substring(0, 10));
                generarNumeroFactura();
            } else {
                const error = await response.json();
                alert('❌ Error: ' + (error.message || 'No se pudo realizar la venta'));
            }
        } catch (error) {
            console.error('Error realizando venta:', error);
            alert('❌ Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen p-8 bg-gray-100 font-sans">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-800 drop-shadow-md">Registro de Ventas</h1>
                    <p className="text-gray-600 mt-2">Módulo de gestión de ventas - Rol: {userRole}</p>
                </div>
                <Link to="/" className="px-6 py-2 bg-orange-500 text-white font-semibold rounded-full shadow-md hover:bg-orange-600 transition-colors duration-300">
                    ← Volver al Inicio
                </Link>
            </header>

            {/* Información de la Venta */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-orange-500 mb-8">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Información de la Venta</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-2">Fecha de Venta *</label>
                        <input
                            type="date"
                            value={fechaVenta}
                            onChange={(e) => setFechaVenta(e.target.value)}
                            className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-2">Cliente *</label>
                        <select
                            value={cliente}
                            onChange={(e) => setCliente(e.target.value)}
                            className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="">Seleccionar cliente</option>
                            {clientes.map(cliente => (
                                <option key={cliente._id} value={cliente._id}>
                                    {cliente.nombre} - {cliente.nit}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600 mb-2">Número de Factura:</label>
                        <input
                            type="text"
                            value={numFactura}
                            onChange={(e) => setNumFactura(e.target.value)}
                            className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-100"
                        />
                    </div>
                    <div className="flex flex-col col-span-1 md:col-span-2 lg:col-span-3">
                        <label className="text-sm font-medium text-gray-600 mb-2">Observaciones:</label>
                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Observaciones adicionales sobre la venta..."
                            className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            rows="3"
                        />
                    </div>
                </div>
            </div>

            {/* Selección de Productos */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-black mb-8">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Agregar Productos</h2>
                
                {/* Productos del Inventario */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Productos del Inventario</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {productosDisponibles.map(producto => (
                            <button
                                key={producto._id}
                                onClick={() => handleAddProductFromInventory(producto._id)}
                                className="p-3 border rounded-lg text-left hover:bg-gray-50 transition-colors"
                            >
                                <div className="font-medium">{producto.nombre}</div>
                                <div className="text-sm text-gray-600">Código: {producto.idProductoTienda}</div>
                                <div className="text-sm text-green-600">Precio: ${producto.precioVenta}</div>
                                <div className="text-sm text-blue-600">Stock: {producto.cantidad}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Agregar Producto Personalizado */}
                <div className="border-t pt-6">
                    <button
                        onClick={() => setMostrarFormProducto(!mostrarFormProducto)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 mb-4"
                    >
                        {mostrarFormProducto ? '✕ Cancelar' : '➕ Agregar Producto Personalizado'}
                    </button>

                    {mostrarFormProducto && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                            <input
                                type="text"
                                value={nuevoProducto.codigo}
                                onChange={(e) => setNuevoProducto({ ...nuevoProducto, codigo: e.target.value })}
                                placeholder="Código del producto"
                                className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="text"
                                value={nuevoProducto.nombre}
                                onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                                placeholder="Nombre del producto"
                                className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="number"
                                value={nuevoProducto.cantidad}
                                onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: parseInt(e.target.value) || 1 })}
                                placeholder="Cantidad"
                                min="1"
                                className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                                type="number"
                                value={nuevoProducto.precioUnitario}
                                onChange={(e) => setNuevoProducto({ ...nuevoProducto, precioUnitario: parseFloat(e.target.value) || 0 })}
                                placeholder="Precio unitario"
                                min="0"
                                step="0.01"
                                className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="md:col-span-4">
                                <button
                                    onClick={handleAddCustomProduct}
                                    disabled={!nuevoProducto.codigo || !nuevoProducto.nombre || nuevoProducto.cantidad <= 0 || nuevoProducto.precioUnitario <= 0}
                                    className="w-full px-6 py-3 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    ✅ Agregar Producto Personalizado
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Resumen de la Venta */}
            <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-orange-500 mb-8">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">
                    Resumen de la Venta {productos.length > 0 && `(${productos.length} productos)`}
                </h2>
                
                {productos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No hay productos agregados a la venta</p>
                        <p className="text-sm">Agrega productos desde el inventario o crea uno personalizado</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {productos.map((producto, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900">{producto.nombre}</div>
                                                <div className="text-sm text-gray-500">Código: {producto.codigo}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ${producto.precioUnitario.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleUpdateProductQuantity(index, producto.cantidad - 1)}
                                                    className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                                                    disabled={producto.cantidad <= 1}
                                                >
                                                    -
                                                </button>
                                                <span className="w-12 text-center">{producto.cantidad}</span>
                                                <button
                                                    onClick={() => handleUpdateProductQuantity(index, producto.cantidad + 1)}
                                                    className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            ${producto.costoTotal.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => handleRemoveProduct(index)} 
                                                className="text-red-600 hover:text-red-900 px-3 py-1 bg-red-100 rounded"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-50 font-bold">
                                    <td colSpan="3" className="px-6 py-4 text-right text-gray-700">TOTAL:</td>
                                    <td className="px-6 py-4 text-gray-900">${total.toFixed(2)}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Botón de realizar venta */}
            <div className="flex justify-center mt-8">
                <button
                    onClick={handleRealizarVenta}
                    disabled={loading || productos.length === 0 || !cliente}
                    className="px-8 py-4 bg-orange-500 text-white font-bold text-xl rounded-full shadow-lg hover:bg-orange-600 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {loading ? '⏳ Procesando Venta...' : `💰 Realizar Venta - $${total.toFixed(2)}`}
                </button>
            </div>
        </div>
    );
};

export default VentasPage;