// front-end/src/assets/pages/HomePage.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Aglomex1 from '../images/Aglomex1.jpg';
import aglomex7 from '../images/aglomex7.jpg';

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
        style={{ backgroundImage: `url(${Aglomex1})` }}
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
          src={aglomex7}
          alt="Aglomex Logo"
          className="w-48 h-auto mb-6 drop-shadow-lg"
        />

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 drop-shadow-md text-center">
          Sistema Web de Gestión Administrativa
        </h1>
        <p className="text-xl text-gray-700 mb-10 text-center max-w-4xl drop-shadow-sm font-medium">
          Para el Control Logístico, Financiero y Toma de Decisiones en la Empresa Aglomex – 2025
        </p>

        {/* Navigation cards container - Updated */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
          {(() => {
            // Obtener usuario del localStorage para aplicar restricción específica
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const isJesus = user.username === 'jesus';

            // Si es 'jesus', mostrar SOLO sus 3 módulos: Finanzas, Logística, Dashboard
            if (isJesus) {
              return (
                <>
                  {/* Dashboard Ejecutivo */}
                  <Link to="/dashboard" className="group transform transition-all duration-300 hover:scale-105">
                    <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl border-t-4 border-orange-500">
                      <span className="text-4xl text-orange-500 mb-4 transition-transform duration-300 group-hover:rotate-6">
                        📊
                      </span>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Ejecutivo</h2>
                      <p className="text-sm text-gray-500 text-center">
                        Visualiza gráficas de ventas y producción.
                      </p>
                    </div>
                  </Link>

                  {/* Logística */}
                  <Link to="/logistica" className="group transform transition-all duration-300 hover:scale-105">
                    <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl border-t-4 border-orange-500">
                      <span className="text-4xl text-orange-500 mb-4 transition-transform duration-300 group-hover:rotate-6">
                        🚚
                      </span>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Logística</h2>
                      <p className="text-sm text-gray-500 text-center">
                        Gestiona pedidos, envíos y distribución de productos.
                      </p>
                    </div>
                  </Link>

                  {/* Finanzas */}
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
              );
            }

            // Si NO es 'jesus', mostrar todo según roles normales
            return (
              <>
                {/* Purchases Card */}
                {userRole !== 'Tienda' && userRole !== 'tienda' && userRole !== 'empleado_tienda' && (
                  <Link to="/compras" className="group transform transition-all duration-300 hover:scale-105">
                    <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl border-t-4 border-orange-500">
                      <span className="text-4xl text-orange-500 mb-4 transition-transform duration-300 group-hover:rotate-6">
                        🛍️
                      </span>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Compras</h2>
                      <p className="text-sm text-gray-500 text-center">
                        Registra las compras a proveedores y gestiona el inventario.
                      </p>
                    </div>
                  </Link>
                )}

                {/* Inventory Card */}
                <Link to="/inventario" className="group transform transition-all duration-300 hover:scale-105">
                  <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl border-t-4 border-orange-500">
                    <span className="text-4xl text-orange-500 mb-4 transition-transform duration-300 group-hover:rotate-6">
                      📦
                    </span>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Inventario</h2>
                    <p className="text-sm text-gray-500 text-center">
                      Controla el stock y el movimiento de productos.
                    </p>
                  </div>
                </Link>

                {/* Sales Card */}
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

                {/* Manufacturing Card */}
                {userRole !== 'Tienda' && userRole !== 'tienda' && userRole !== 'empleado_tienda' && (
                  <Link to="/fabricacion" className="group transform transition-all duration-300 hover:scale-105">
                    <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl border-t-4 border-orange-500">
                      <span className="text-4xl text-orange-500 mb-4 transition-transform duration-300 group-hover:rotate-6">
                        🔨
                      </span>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Fabricación</h2>
                      <p className="text-sm text-gray-500 text-center">
                        Gestiona órdenes de producción y uso de materiales.
                      </p>
                    </div>
                  </Link>
                )}

                {/* Dashboard Ejecutivo Card */}
                {userRole !== 'Tienda' && userRole !== 'tienda' && userRole !== 'empleado_tienda' && (
                  <Link to="/dashboard" className="group transform transition-all duration-300 hover:scale-105">
                    <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl border-t-4 border-orange-500">
                      <span className="text-4xl text-orange-500 mb-4 transition-transform duration-300 group-hover:rotate-6">
                        📊
                      </span>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Ejecutivo</h2>
                      <p className="text-sm text-gray-500 text-center">
                        Visualiza gráficas de ventas y producción.
                      </p>
                    </div>
                  </Link>
                )}

                {/* Logistics Card */}
                {userRole !== 'Tienda' && userRole !== 'tienda' && userRole !== 'empleado_tienda' && (
                  <Link to="/logistica" className="group transform transition-all duration-300 hover:scale-105">
                    <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl border-t-4 border-orange-500">
                      <span className="text-4xl text-orange-500 mb-4 transition-transform duration-300 group-hover:rotate-6">
                        🚚
                      </span>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Logística</h2>
                      <p className="text-sm text-gray-500 text-center">
                        Gestiona pedidos, envíos y distribución de productos.
                      </p>
                    </div>
                  </Link>
                )}

                {/* Advanced Reports Card */}
                {userRole !== 'Tienda' && userRole !== 'tienda' && userRole !== 'empleado_tienda' && (
                  <Link to="/reportes" className="group transform transition-all duration-300 hover:scale-105">
                    <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl border-t-4 border-orange-500">
                      <span className="text-4xl text-orange-500 mb-4 transition-transform duration-300 group-hover:rotate-6">
                        📖
                      </span>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Reportes</h2>
                      <p className="text-sm text-gray-500 text-center">
                        Reportes avanzados de ventas y compras (Diario, Mensual, Anual).
                      </p>
                    </div>
                  </Link>
                )}

                {/* Finance Card */}
                {(userRole === 'admin' || userRole === 'Tienda' || userRole === 'tienda' || userRole === 'empleado_tienda') && (
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
                )}

                {/* Usuarios Card */}
                {userRole === 'admin' && (
                  <Link to="/usuarios" className="group transform transition-all duration-300 hover:scale-105">
                    <div className="flex flex-col items-center p-8 bg-white rounded-2xl shadow-xl border-t-4 border-blue-500">
                      <span className="text-4xl text-blue-500 mb-4 transition-transform duration-300 group-hover:rotate-6">
                        👥
                      </span>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">Usuarios</h2>
                      <p className="text-sm text-gray-500 text-center">
                        Gestiona los usuarios del sistema (Altas, Bajas y Roles).
                      </p>
                    </div>
                  </Link>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
