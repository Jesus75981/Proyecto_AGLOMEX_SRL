import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const InventarioPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products');
        if (!response.ok) {
          throw new Error('Error al cargar los productos');
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Inventario de Productos</h1>
        <Link to="/" className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300">
          Volver
        </Link>
      </div>
      <p className="text-gray-400 mb-8">
        Aquí puedes ver el inventario actual de tus productos.
      </p>

      {loading && (
        <div className="flex justify-center items-center">
          <p className="text-xl">Cargando inventario...</p>
        </div>
      )}

      {error && (
        <div className="flex justify-center items-center">
          <p className="text-red-500 text-xl">Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Precio
                </th>
                <th className="py-3 px-6 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Stock
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {products.map(product => (
                <tr key={product._id} className="hover:bg-gray-700 transition-colors duration-200">
                  <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-200">
                    {product._id}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-300">
                    {product.name}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-300">
                    {product.description}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-300">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-300">
                    {product.stock}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InventarioPage;
