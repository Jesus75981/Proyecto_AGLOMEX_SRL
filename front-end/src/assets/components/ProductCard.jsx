// src/components/ProductCard.jsx
import React from 'react';

const ProductCard = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-sm mx-auto">
      <img
        className="w-full h-48 object-cover"
        src="https://via.placeholder.com/400x300"
        alt="Imagen de un mueble"
      />
      <div className="p-6">
        <h2 className="text-xl font-bold mb-2">Mesa de Noche</h2>
        <p className="text-gray-700 mb-4">
          Mesa de noche minimalista, ideal para cualquier habitación. Fabricada con madera de pino y acabado en color blanco.
        </p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">$150.00</span>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300">
            Añadir al carrito
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;