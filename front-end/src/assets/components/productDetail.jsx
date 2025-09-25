// src/components/ProductDetail.jsx
import React, { useState } from 'react';
import ARView from './ARView';

const ProductDetail = ({ product, onClose }) => {
  const [arEnabled, setArEnabled] = useState(false);

  // Accede a las propiedades directamente desde el objeto product
  const { nombre, descripcion, precioVenta, imagen, objeto3D } = product;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto p-8">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-gray-900">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex flex-col md:flex-row gap-8 mt-12">
        <div className="md:w-1/2">
          <img
            src={imagen} 
            alt={nombre}
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>
        <div className="md:w-1/2 flex flex-col justify-center">
          <h1 className="text-4xl font-bold text-gray-800">{nombre}</h1>
          <p className="text-gray-600 mt-4">{descripcion}</p>
          <p className="text-gray-900 font-bold text-2xl mt-4">${precioVenta}</p>

          <button
            onClick={() => setArEnabled(true)}
            className="mt-8 bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600 transition-colors"
          >
            Ver en Realidad Aumentada
          </button>
        </div>
      </div>
      {/* Muestra el visor AR solo si el estado `arEnabled` es true y el objeto3D existe */}
      {arEnabled && objeto3D && <ARView modelUrl={objeto3D.glbUrl} />}
    </div>
  );
};

export default ProductDetail;