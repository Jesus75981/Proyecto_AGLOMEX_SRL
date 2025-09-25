import React from 'react';
import { Link, useNavigate } from 'react-router-dom';


const HomePage = ({ userRole, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Background with Aglomex image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: `url('/Aglomex1.jpg')` }}
      ></div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6">
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="absolute top-6 right-6 px-6 py-2 bg-red-500 text-white font-semibold rounded-full shadow-md hover:bg-red-600 transition-colors duration-300"
        >
          Cerrar Sesión
        </button>

        {/* Aglomex Logo */}
        <img 
          src='/aglomex7.jpg'
          alt="Aglomex Logo" 
          className="w-48 h-auto mb-6 drop-shadow-lg" 
        />
        
        <h1 className="text-5xl font-extrabold text-gray-900 mb-2 drop-shadow-md">
          Sistema de Gestión Aglomex
        </h1>
        <p className="text-xl text-gray-600 mb-10 text-center max-w-2xl drop-shadow-sm">
          Plataforma integral para la administración de ventas, compras, fabricación y más.
        </p>
        
        {/* Navigation cards container */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">

          {/* Sales Card - Visible for both */}
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

          {/* Purchases Card - Visible for both */}
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

          {/* Manufacturing Card - Visible for both */}
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

          {/* Daily Reports Card - Visible for both */}
          <Link to="/reporte-ventas-diario" className="group transform transition-all duration-300 hover:scale-105">
            <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl border-t-4 border-orange-500">
              <span className="text-4xl text-orange-500 mb-4 transition-transform duration-300 group-hover:rotate-6">
                📊
              </span>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Reportes Diarios</h2>
              <p className="text-sm text-gray-500 text-center">
                Visualiza las ventas por día.
              </p>
            </div>
          </Link>

          {/* Inventory Card - Visible for both */}
          <Link to="/inventario" className="group transform transition-all duration-300 hover:scale-105">
            <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl border-t-4 border-black">
              <span className="text-4xl text-black mb-4 transition-transform duration-300 group-hover:rotate-6">
                📦
              </span>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Inventario</h2>
              <p className="text-sm text-gray-500 text-center">
                Controla el stock y el movimiento de productos.
              </p>
            </div>
          </Link>

          {/* Admin-only cards */}
          {userRole === 'admin' && (
            <>
              {/* Catalog Card */}
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
              {/* Finance Card */}
              <Link to="/finanzas" className="group transform transition-all duration-300 hover:scale-105">
                <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl border-t-4 border-orange-500">
                  <span className="text-4xl text-orange-500 mb-4 transition-transform duration-300 group-hover:rotate-6">
                    💰
                  </span>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Finanzas</h2>
                  <p className="text-sm text-gray-500 text-center">
                    Administra los ingresos, egresos y otros movimientos financieros.
                  </p>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;