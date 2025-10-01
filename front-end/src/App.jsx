// front-end/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, BrowserRouter } from 'react-router-dom';

// ✅ IMPORTACIONES DIRECTAS - SIN LAZY LOADING
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

// Componente de carga
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
      <p className="text-gray-600">Cargando sistema Aglomex...</p>
    </div>
  </div>
);

// Componente para páginas en desarrollo
const PageEnDesarrollo = ({ pageName }) => (
  <div className="min-h-screen flex items-center justify-center bg-yellow-50">
    <div className="text-center p-8">
      <h2 className="text-2xl font-bold text-yellow-600 mb-2">🛠️ Página en Desarrollo</h2>
      <p className="text-gray-700">{pageName} - Próximamente disponible</p>
      <Link to="/" className="mt-4 inline-block bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">
        Volver al Inicio
      </Link>
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
        
        // Redirigir al login si no está autenticado
        const token = localStorage.getItem('token');
        if (!token && window.location.pathname !== '/login') {
          navigate('/login');
        }
      }
    };

    initializeApp();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserRole(null);
    navigate('/login');
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="App">
      <Routes>
        <Route 
          path="/login" 
          element={<LoginPage onLogin={setUserRole} />} 
        />
        
        {userRole ? (
          <>
            <Route path="/" element={<HomePage userRole={userRole} onLogout={handleLogout} />} />
            <Route path="/ventas" element={<VentasPage userRole={userRole} />} />
            <Route path="/compras" element={<ComprasPage />} />
            <Route path="/inventario" element={<InventarioPage />} />
            <Route path="/fabricacion" element={<FabricacionPage />} />
            <Route path="/finanzas" element={<FinanzasPage />} />
            <Route path="/logistica" element={<LogisticaPage userRole={userRole} />} />
            <Route path="/admin-catalogo" element={<AdminCatalogPage />} />
            <Route path="/reporte-ventas-diario" element={<ReporteVentasDiario />} />
          </>
        ) : (
          <Route 
            path="*" 
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Sistema Aglomex</h1>
                  <button 
                    onClick={() => navigate('/login')}
                    className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600"
                  >
                    Iniciar Sesión
                  </button>
                </div>
              </div>
            } 
          />
        )}
      </Routes>
    </div>
  );
}

// Componente App que envuelve con BrowserRouter
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;