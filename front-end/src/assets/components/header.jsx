// src/components/Header.jsx
import React from 'react';

const Header = () => {
  return (
    <header className="bg-white shadow-md p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-800">Muebles AR</h1>
      <nav>
        <a href="#" className="text-gray-600 hover:text-gray-900 mx-2">Inicio</a>
        <a href="#" className="text-gray-600 hover:text-gray-900 mx-2">Catálogo</a>
      </nav>
    </header>
  );
};

export default Header;