// src/components/ProductCard.jsx
import React from 'react';

const ProductCard = ({ product, onProductSelect }) => {
  return (
    <div
      className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform transform hover:scale-105"
      onClick={() => onProductSelect(product)}
    >
      <img
        src={product.imagen} // Usa la propiedad `imagen` de tu modelo
        alt={product.nombre}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-800">{product.nombre}</h3>
        <p className="text-gray-900 font-bold text-lg mt-2">${product.precioVenta}</p>
      </div>
    </div>
  );
};

export default ProductCard;