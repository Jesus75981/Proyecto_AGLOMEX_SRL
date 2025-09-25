import React from 'react';
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

export default Navbar;