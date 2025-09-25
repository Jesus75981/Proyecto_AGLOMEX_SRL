import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const VentasPage = () => {
    // State to manage form inputs and products
    const [cliente, setCliente] = useState('');
    const [numFactura, setNumFactura] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [productos, setProductos] = useState([]);
    const [nuevoProducto, setNuevoProducto] = useState({ codigo: '', nombre: '', cantidad: 0, costoUnitario: 0 });
    const [total, setTotal] = useState(0);

    const handleAddProduct = () => {
        if (nuevoProducto.codigo && nuevoProducto.nombre && nuevoProducto.cantidad > 0 && nuevoProducto.costoUnitario > 0) {
            const costoTotalProducto = nuevoProducto.cantidad * nuevoProducto.costoUnitario;
            setProductos([...productos, { ...nuevoProducto, costoTotal: costoTotalProducto }]);
            setTotal(total + costoTotalProducto);
            setNuevoProducto({ codigo: '', nombre: '', cantidad: 0, costoUnitario: 0 });
        } else {
            alert('Por favor, completa todos los campos del producto.');
        }
    };

    const handleRemoveProduct = (index) => {
        const productToRemove = productos[index];
        const newProducts = productos.filter((_, i) => i !== index);
        setProductos(newProducts);
        setTotal(total - productToRemove.costoTotal);
    };

    const handleRealizarVenta = () => {
        if (cliente && productos.length > 0) {
            // Logic to save the sale (e.g., call a backend API)
            console.log('Venta realizada:', {
                cliente,
                numFactura,
                observaciones,
                productos,
                total,
            });
            alert('Venta realizada con éxito!');
            // Reset the form
            setCliente('');
            setNumFactura('');
            setObservaciones('');
            setProductos([]);
            setTotal(0);
        } else {
            alert('Por favor, completa los campos de cliente y agrega al menos un producto.');
        }
    };

    return (
        <div className="relative min-h-screen p-8 bg-gray-100 font-sans">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-gray-800 drop-shadow-md">Registro de Ventas</h1>
                <Link to="/" className="px-6 py-2 bg-orange-500 text-white font-semibold rounded-full shadow-md hover:bg-orange-600 transition-colors duration-300">
                    Volver al Inicio
                </Link>
            </header>

            <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-orange-500 mb-8">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Información de la Venta</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600">Fecha:</label>
                        <input
                            type="date"
                            defaultValue={new Date().toISOString().substring(0, 10)}
                            className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600">Cliente:</label>
                        <input
                            type="text"
                            value={cliente}
                            onChange={(e) => setCliente(e.target.value)}
                            placeholder="Nombre del cliente"
                            className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-600">Número de Factura:</label>
                        <input
                            type="text"
                            value={numFactura}
                            onChange={(e) => setNumFactura(e.target.value)}
                            placeholder="Manual"
                            className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div className="flex flex-col col-span-1 md:col-span-2 lg:col-span-3">
                        <label className="text-sm font-medium text-gray-600">Observaciones:</label>
                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Ejemplo: El cliente retirará la mercadería una vez cancelado"
                            className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-black mb-8">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Detalles del Producto</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <input
                        type="text"
                        value={nuevoProducto.codigo}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, codigo: e.target.value })}
                        placeholder="Código"
                        className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                        type="text"
                        value={nuevoProducto.nombre}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
                        placeholder="Nombre"
                        className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                        type="number"
                        value={nuevoProducto.cantidad}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: e.target.value })}
                        placeholder="Cantidad"
                        className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                        type="number"
                        value={nuevoProducto.costoUnitario}
                        onChange={(e) => setNuevoProducto({ ...nuevoProducto, costoUnitario: e.target.value })}
                        placeholder="Costo Unitario"
                        className="p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                <button
                    onClick={handleAddProduct}
                    className="w-full px-6 py-3 bg-black text-white font-semibold rounded-md shadow-md hover:bg-gray-800 transition-colors duration-300"
                >
                    Agregar Producto
                </button>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-orange-500">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Resumen de la Venta</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N.°</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Producto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Unitario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {productos.map((producto, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.codigo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.cantidad}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${producto.costoUnitario.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${producto.costoTotal.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleRemoveProduct(index)} className="text-red-600 hover:text-red-900">
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-right font-bold text-gray-700">TOTAL:</td>
                                <td className="px-6 py-4 font-bold text-gray-900">${total.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-center mt-8">
                <button
                    onClick={handleRealizarVenta}
                    className="px-8 py-4 bg-orange-500 text-white font-bold text-xl rounded-full shadow-lg hover:bg-orange-600 transition-colors duration-300"
                >
                    Realizar Venta
                </button>
            </div>
        </div>
    );
};

export default VentasPage;
