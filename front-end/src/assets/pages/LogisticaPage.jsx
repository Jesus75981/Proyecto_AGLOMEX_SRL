import React, { useState } from 'react';

const LogisticaPage = () => {
    // Puedes usar un estado para manejar los datos de los envíos
    // Para empezar, usamos datos de prueba
    const [envios, setEnvios] = useState([
        { id: 'ENV-001', destino: 'Madrid, España', estado: 'En Tránsito' },
        { id: 'ENV-002', destino: 'Ciudad de México, México', estado: 'Entregado' },
        { id: 'ENV-003', destino: 'Buenos Aires, Argentina', estado: 'Pendiente' },
    ]);

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-gray-800">Módulo de Logística</h1>
                    <p className="text-gray-500 mt-2 text-lg">Administra tus envíos de manera eficiente.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-blue-500 text-white p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold mb-2">Total de Envíos</h3>
                        <p className="text-3xl font-bold">{envios.length}</p>
                    </div>
                    <div className="bg-yellow-500 text-white p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold mb-2">En Tránsito</h3>
                        <p className="text-3xl font-bold">{envios.filter(e => e.estado === 'En Tránsito').length}</p>
                    </div>
                    <div className="bg-green-500 text-white p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold mb-2">Entregados</h3>
                        <p className="text-3xl font-bold">{envios.filter(e => e.estado === 'Entregado').length}</p>
                    </div>
                    <div className="bg-red-500 text-white p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold mb-2">Pendientes</h3>
                        <p className="text-3xl font-bold">{envios.filter(e => e.estado === 'Pendiente').length}</p>
                    </div>
                </div>

                <div className="mb-10 p-6 bg-white rounded-xl shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Agregar Nuevo Envío</h2>
                    <form className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div>
                            <label htmlFor="id" className="block text-sm font-medium text-gray-700">ID del Envío</label>
                            <input type="text" id="id" name="id" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Ej. ENV-004" />
                        </div>
                        <div>
                            <label htmlFor="destination" className="block text-sm font-medium text-gray-700">Destino</label>
                            <input type="text" id="destination" name="destination" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="Ej. Lima, Perú" />
                        </div>
                        <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md">
                            Agregar Envío
                        </button>
                    </form>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Listado de Envíos</h2>
                    <div className="overflow-x-auto rounded-xl shadow-sm">
                        <table className="min-w-full bg-white rounded-xl">
                            <thead>
                                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                                    <th className="py-3 px-6 text-left">ID</th>
                                    <th className="py-3 px-6 text-left">Destino</th>
                                    <th className="py-3 px-6 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 text-sm font-light">
                                {envios.map((envio, index) => (
                                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="py-3 px-6 text-left font-medium">{envio.id}</td>
                                        <td className="py-3 px-6 text-left">{envio.destino}</td>
                                        <td className="py-3 px-6 text-center">
                                            <span
                                                className={`py-1 px-3 rounded-full text-xs font-semibold
                                                    ${envio.estado === 'En Tránsito' ? 'bg-yellow-200 text-yellow-600' : ''}
                                                    ${envio.estado === 'Entregado' ? 'bg-green-200 text-green-600' : ''}
                                                    ${envio.estado === 'Pendiente' ? 'bg-red-200 text-red-600' : ''}
                                                `}
                                            >
                                                {envio.estado}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogisticaPage;