// src/assets/pages/VentasPage.jsx
import React from 'react';

const VentasPage = () => {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Realizar Venta</h1>
      
      {/* Sección del formulario */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" defaultValue="POR DEFECTO" disabled />
          </div>
          
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Cliente</label>
            <input type="text" placeholder="Buscador y opción a crear cliente" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          
          {/* Número de Venta */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Num de Venta</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" defaultValue="POR DEFECTO" disabled />
          </div>
          
          {/* Número de Factura */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Num de Factura</label>
            <input type="text" placeholder="MANUAL" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
        </div>
        
        {/* Observaciones */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">Observaciones</label>
          <textarea className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" rows="3" placeholder="Ejemplo: El cliente retirará la mercadería una vez cancelado"></textarea>
        </div>
      </div>
      
      {/* Sección de la tabla de productos */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4">Detalle de la Venta</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N.-</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Unit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Filas de la tabla (por ahora estáticas) */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap">1</td>
              <td className="px-6 py-4 whitespace-nowrap"><input type="text" className="w-20 border rounded" /></td>
              <td className="px-6 py-4 whitespace-nowrap">Por defecto</td>
              <td className="px-6 py-4 whitespace-nowrap">A-11</td>
              <td className="px-6 py-4 whitespace-nowrap">P/D</td>
              <td className="px-6 py-4 whitespace-nowrap"><input type="text" className="w-20 border rounded" /></td>
              <td className="px-6 py-4 whitespace-nowrap">Automático</td>
            </tr>
            {/* Puedes agregar más filas aquí */}
          </tbody>
        </table>
        <div className="mt-4 flex justify-end">
          <div className="text-right">
            <p className="font-bold">Total: <span className="text-lg">Automático</span></p>
          </div>
        </div>
      </div>
      
      {/* Sección del método de pago */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-bold mb-4">Método de Pago</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center">
            <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" id="efectivo" />
            <label htmlFor="efectivo" className="ml-2 text-sm font-medium text-gray-700">1. Efectivo</label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" id="transferencia" />
            <label htmlFor="transferencia" className="ml-2 text-sm font-medium text-gray-700">2. Transferencia</label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" id="cheque" />
            <label htmlFor="cheque" className="ml-2 text-sm font-medium text-gray-700">3. Cheque</label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" id="credito" />
            <label htmlFor="credito" className="ml-2 text-sm font-medium text-gray-700">4. Credito</label>
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <button className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors">
          CONFIRMAR VENTA
        </button>
      </div>
    </div>
  );
};

export default VentasPage;