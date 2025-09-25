import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Componente de navegación integrado para evitar errores de importación
const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4 rounded-lg shadow-lg mb-8">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white font-bold text-2xl">
          <Link to="/">Muebles 2025</Link>
        </div>
        <div className="flex space-x-4">
          <Link to="/catalogo" className="text-gray-300 hover:text-white transition-colors duration-300">
            Catálogo
          </Link>
          <Link to="/inventario" className="text-gray-300 hover:text-white transition-colors duration-300">
            Inventario
          </Link>
          <Link to="/finanzas" className="text-gray-300 hover:text-white transition-colors duration-300">
            Finanzas
          </Link>
          <Link to="/compras" className="text-gray-300 hover:text-white transition-colors duration-300">
            Compras
          </Link>
          <Link to="/fabricacion" className="text-gray-300 hover:text-white transition-colors duration-300">
            Fabricación
          </Link>
        </div>
      </div>
    </nav>
  );
};

const ComprasPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const suppliersRes = await fetch('http://localhost:5000/api/suppliers');
        const productsRes = await fetch('http://localhost:5000/api/products');
        const purchasesRes = await fetch('http://localhost:5000/api/purchases');

        if (!suppliersRes.ok || !productsRes.ok || !purchasesRes.ok) {
          throw new Error('Error al cargar los datos');
        }

        const suppliersData = await suppliersRes.json();
        const productsData = await productsRes.json();
        const purchasesData = await purchasesRes.json();

        setSuppliers(suppliersData);
        setProducts(productsData);
        setPurchases(purchasesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePurchase = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (!selectedSupplier || !selectedProduct || quantity <= 0 || price <= 0) {
        throw new Error('Por favor, completa todos los campos con valores válidos.');
      }

      const response = await fetch('http://localhost:5000/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplier: selectedSupplier,
          product: selectedProduct,
          quantity: parseInt(quantity, 10),
          price: parseFloat(price)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar la compra.');
      }

      // Actualizar el estado de las compras y productos (para reflejar el stock)
      setPurchases(prev => [...prev, data]);
      setSuccess('Compra registrada con éxito.');
      setSelectedSupplier('');
      setSelectedProduct('');
      setQuantity('');
      setPrice('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <p className="text-white text-2xl">Cargando módulo de compras...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Navbar />
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Módulo de Compras</h1>
          <Link to="/" className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300">
            Volver
          </Link>
        </div>
        <p className="text-gray-400 mb-8">
          Gestiona las compras a tus proveedores. Aquí puedes registrar nuevas compras y ver el historial.
        </p>

        {error && (
          <div className="bg-red-800 text-white p-4 rounded-lg mb-6 text-center">{error}</div>
        )}
        {success && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-6 text-center">{success}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Registrar Compra</h2>
            <form onSubmit={handlePurchase}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="supplier">
                  Proveedor
                </label>
                <select
                  id="supplier"
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="shadow border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Selecciona un proveedor</option>
                  {suppliers.map(supplier => (
                    <option key={supplier._id} value={supplier._id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="product">
                  Producto
                </label>
                <select
                  id="product"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="shadow border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Selecciona un producto</option>
                  {products.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="quantity">
                  Cantidad
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="price">
                  Precio Total
                </label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 w-full"
              >
                Registrar Compra
              </button>
            </form>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Historial de Compras</h2>
            {purchases.length > 0 ? (
              <ul className="divide-y divide-gray-700">
                {purchases.map(purchase => (
                  <li key={purchase._id} className="py-4">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-medium text-gray-200">
                        Producto: {products.find(p => p._id === purchase.product)?.name || 'Producto no encontrado'}
                      </p>
                      <span className="text-sm font-bold text-orange-400">
                        x{purchase.quantity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Proveedor: {suppliers.find(s => s._id === purchase.supplier)?.name || 'Proveedor no encontrado'}
                    </p>
                    <p className="text-sm text-gray-400">
                      Costo: ${purchase.price}
                    </p>
                    <p className="text-sm text-gray-400">
                      Fecha: {new Date(purchase.date).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">Aún no hay compras registradas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprasPage;