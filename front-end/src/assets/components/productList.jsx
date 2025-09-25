// src/components/ProductList.jsx
import React, { useState, useEffect } from 'react';
import ProductCard from './productCard';
import ProductDetail from './productDetail';
// No necesitas importar `Carousel` si no lo vas a usar

const API_URL = 'http://localhost:3000/api/productos'; // Asegúrate de que esta URL sea correcta

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setProducts(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return <div>Cargando productos...</div>;
  if (error) return <div>Error: {error}</div>;
  if (selectedProduct) {
    return <ProductDetail product={selectedProduct} onClose={() => setSelectedProduct(null)} />;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Catálogo de Muebles</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product._id} 
            product={product}
            onProductSelect={setSelectedProduct}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductList;