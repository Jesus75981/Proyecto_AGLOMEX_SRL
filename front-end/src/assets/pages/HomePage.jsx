// src/pages/HomePage.jsx
import React from 'react';
import ProductCard from '../components/ProductCard'; // Importa el componente

const HomePage = () => {
  return (
    <div className="bg-gray-100 min-h-screen p-8">
      {/* Sección de encabezado */}
      <header className="text-center py-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          ¡Bienvenidos a tu tienda de muebles!
        </h1>
        <p className="text-lg text-gray-600">
          Encuentra la pieza perfecta para tu hogar.
        </p>
      </header>

      {/* Sección de productos */}
      <section className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">
          Nuestros productos destacados
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Aquí usas tus componentes de tarjeta de producto */}
          <ProductCard />
          <ProductCard />
          <ProductCard />
          {/* Puedes duplicar más tarjetas para llenar la página */}
        </div>
      </section>
    </div>
  );
};

export default HomePage;