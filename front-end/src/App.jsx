import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, BrowserRouter } from 'react-router-dom';

// ✅ IMPORTACIONES DIRECTAS
import HomePage from "./assets/pages/HomePage.jsx";
import LoginPage from "./assets/pages/LoginPage.jsx";
import VentasPage from "./assets/pages/VentasPage.jsx";
import ComprasPage from "./assets/pages/ComprasPage.jsx";
import InventarioPage from "./assets/pages/InventarioPage.jsx";
import FabricacionPage from "./assets/pages/FabricacionPage.jsx";
import FinanzasPage from "./assets/pages/FinanzasPage.jsx";
import LogisticaPage from "./assets/pages/LogisticaPage.jsx";
import AdminCatalogPage from "./assets/pages/AdminCatalogPage.jsx";
import ReporteVentasDiario from "./assets/pages/ReporteVentasDiario.jsx";
import CatalogPage from "./assets/pages/CatalogPage.jsx";

// Componente de carga
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
      <p className="text-gray-600">Cargando sistema Aglomex...</p>
    </div>
  </div>
);

// Componente principal de la aplicación
function AppContent() {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          setUserRole(user.rol);
        }
      } catch (error) {
        console.error('Error inicializando app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserRole(null);
    navigate('/');
  };

  const handleLogin = (userRole) => {
    setUserRole(userRole);
    navigate('/home');
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="App">
      <Routes>
        {/* ✅ RUTAS PÚBLICAS */}
        <Route path="/" element={<CatalogPage />} />
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        
        {/* ✅ RUTAS PRIVADAS */}
        {userRole ? (
          <>
            <Route path="/home" element={<HomePage userRole={userRole} onLogout={handleLogout} />} />
            <Route path="/ventas" element={<VentasPage userRole={userRole} />} />
            <Route path="/compras" element={<ComprasPage userRole={userRole} />} />
            <Route path="/inventario" element={<InventarioPage userRole={userRole} />} />
            <Route path="/fabricacion" element={<FabricacionPage userRole={userRole} />} />
            <Route path="/finanzas" element={<FinanzasPage userRole={userRole} />} />
            <Route path="/logistica" element={<LogisticaPage userRole={userRole} />} />
            <Route path="/admin-catalogo" element={<AdminCatalogPage userRole={userRole} />} />
            <Route path="/reporte-ventas-diario" element={<ReporteVentasDiario userRole={userRole} />} />
          </>
        ) : (
          <Route 
            path="*" 
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="text-center text-white">
                  <h1 className="text-2xl font-bold mb-4">Acceso Restringido</h1>
                  <p className="text-gray-400 mb-6">Necesitas iniciar sesión para acceder al sistema</p>
                  <div className="space-x-4">
                    <button 
                      onClick={() => navigate('/')}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
                    >
                      Ver Catálogo
                    </button>
                    <button 
                      onClick={() => navigate('/login')}
                      className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600"
                    >
                      Iniciar Sesión
                    </button>
                  </div>
                </div>
              </div>
            } 
          />
        )}
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;