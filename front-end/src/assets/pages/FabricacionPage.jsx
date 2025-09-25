import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
        </div>
      </div>
    </nav>
  );
};

const FabricationPage = () => {
  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [fabrications, setFabrications] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsRes = await fetch('http://localhost:5000/api/products');
        const recipesRes = await fetch('http://localhost:5000/api/recipes');
        const fabricationsRes = await fetch('http://localhost:5000/api/fabrications');

        if (!productsRes.ok || !recipesRes.ok || !fabricationsRes.ok) {
          throw new Error('Error al cargar los datos');
        }

        const productsData = await productsRes.json();
        const recipesData = await recipesRes.json();
        const fabricationsData = await fabricationsRes.json();

        setProducts(productsData);
        setRecipes(recipesData);
        setFabrications(fabricationsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFabricate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (!selectedProduct || quantity <= 0) {
        throw new Error('Por favor, selecciona un producto y una cantidad válida.');
      }

      const response = await fetch('http://localhost:5000/api/fabrications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product: selectedProduct, quantity: parseInt(quantity, 10) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar la fabricación.');
      }

      // Actualizar el estado de la fabricación y los productos
      setFabrications(prev => [...prev, data]);
      setSuccess('Fabricación registrada con éxito.');
      setQuantity('');
      setSelectedProduct('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <p className="text-white text-2xl">Cargando módulo de fabricación...</p>
      </div>
    );
  }

  const finishedProducts = products.filter(p => recipes.some(r => r.finishedProduct?._id === p._id));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <Navbar />
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Módulo de Fabricación</h1>
          <Link to="/" className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300">
            Volver
          </Link>
        </div>
        <p className="text-gray-400 mb-8">
          Gestiona la producción de tus muebles. Aquí puedes registrar la fabricación de productos y ver el historial.
        </p>

        {error && (
          <div className="bg-red-800 text-white p-4 rounded-lg mb-6 text-center">{error}</div>
        )}
        {success && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-6 text-center">{success}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Registrar Fabricación</h2>
            <form onSubmit={handleFabricate}>
              <div className="mb-4">
                <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="product">
                  Producto a Fabricar
                </label>
                <select
                  id="product"
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="shadow border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">Selecciona un producto</option>
                  {finishedProducts.map(product => (
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
              <button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 w-full"
              >
                Registrar Fabricación
              </button>
            </form>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">Historial de Fabricación</h2>
            {fabrications.length > 0 ? (
              <ul className="divide-y divide-gray-700">
                {fabrications.map(fab => (
                  <li key={fab._id} className="py-4">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-medium text-gray-200">
                        {fab.product?.name || 'Producto no encontrado'}
                      </p>
                      <span className="text-sm font-bold text-orange-400">
                        x{fab.quantity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Fecha: {new Date(fab.date).toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">Aún no hay fabricaciones registradas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FabricationPage;