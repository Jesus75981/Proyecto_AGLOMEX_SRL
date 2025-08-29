import React from 'react';
import { Link } from 'react-router-dom';
import aglomexLogo from '../images/aglomex7.jpg';

const HomePage = () => {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Fondo con imagen de Aglomex */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: `url('/aglomex1.jpg')` }}
      ></div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-2 drop-shadow-md">
          Sistema de Gestión Aglomex
        </h1>
        <p className="text-xl text-gray-600 mb-10 text-center max-w-2xl drop-shadow-sm">
          Plataforma integral para la administración de ventas, compras, fabricación y más.
        </p>

        {/* Contenedor de las tarjetas de navegación */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">

          {/* Tarjeta de Ventas */}
          <Link to="/ventas" className="group transform transition-all duration-300 hover:scale-105">
            <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl border-t-4 border-orange-500">
              <span className="text-4xl text-orange-500 mb-4 transition-transform duration-300 group-hover:rotate-6">
                🛒
              </span>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Ventas</h2>
              <p className="text-sm text-gray-500 text-center">
                Gestiona todas las ventas y pedidos de los clientes.
              </p>
            </div>
          </Link>

          {/* Tarjeta de Compras */}
          <Link to="/compras" className="group transform transition-all duration-300 hover:scale-105">
            <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl border-t-4 border-black">
              <span className="text-4xl text-black mb-4 transition-transform duration-300 group-hover:rotate-6">
                📦
              </span>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Compras</h2>
              <p className="text-sm text-gray-500 text-center">
                Registra las compras a proveedores y gestiona el inventario.
              </p>
            </div>
          </Link>

          {/* Tarjeta de Fabricación */}
          <Link to="/fabricacion" className="group transform transition-all duration-300 hover:scale-105">
            <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl border-t-4 border-orange-500">
              <span className="text-4xl text-orange-500 mb-4 transition-transform duration-300 group-hover:rotate-6">
                🔧
              </span>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Fabricación</h2>
              <p className="text-sm text-gray-500 text-center">
                Crea productos nuevos a partir de insumos.
              </p>
            </div>
          </Link>

          {/* Tarjeta de Catálogo de Productos */}
          <Link to="/admin-catalogo" className="group transform transition-all duration-300 hover:scale-105">
            <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl border-t-4 border-black">
              <span className="text-4xl text-black mb-4 transition-transform duration-300 group-hover:rotate-6">
                📋
              </span>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Catálogo</h2>
              <p className="text-sm text-gray-500 text-center">
                Administra los productos disponibles y sus detalles.
              </p>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
};

export default HomePage;
  
