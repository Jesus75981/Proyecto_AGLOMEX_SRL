import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        
        {/* Logo */}
        <h1 className="text-2xl font-bold tracking-wide hover:text-gray-200">
          Proyecto Muebles
        </h1>

        {/* Links */}
        <ul className="flex space-x-6 text-lg font-medium">
          <li>
            <Link 
              to="/" 
              className="hover:text-yellow-300 transition-colors"
            >
              Inicio
            </Link>
          </li>
          <li>
            <Link 
              to="/ventas" 
              className="hover:text-yellow-300 transition-colors"
            >
              Ventas
            </Link>
          </li>
          <li>
            <Link 
              to="/login" 
              className="hover:text-yellow-300 transition-colors"
            >
              Login
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
