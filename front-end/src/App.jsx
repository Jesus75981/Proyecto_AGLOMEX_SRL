import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, BrowserRouter, Navigate } from 'react-router-dom';
import axios from 'axios';

// ✅ CARGA PEREZOSA (Optimización para Lighthouse 100%)
const LandingPage = lazy(() => import("./assets/pages/LandingPage.jsx"));
const RecepcionPedidosPage = lazy(() => import("./assets/pages/RecepcionPedidosPage.jsx"));
const HomePage = lazy(() => import("./assets/pages/HomePage.jsx"));
const LoginPage = lazy(() => import("./assets/pages/LoginPage.jsx"));
const VentasPage = lazy(() => import("./assets/pages/VentasPage.jsx"));
const ComprasPage = lazy(() => import("./assets/pages/ComprasPage.jsx"));
const InventarioPage = lazy(() => import("./assets/pages/InventarioPage.jsx"));
const FabricacionPage = lazy(() => import("./assets/pages/FabricacionPage.jsx"));
const FinanzasPage = lazy(() => import("./assets/pages/FinanzasPage.jsx"));
const LogisticaPage = lazy(() => import("./assets/pages/LogisticaPage.jsx"));
const AdminCatalogPage = lazy(() => import("./assets/pages/AdminCatalogPage.jsx"));
const ReportesDiarios = lazy(() => import("./assets/pages/ReportesDiarios.jsx"));
const ReportesPage = lazy(() => import("./assets/pages/ReportesPage.jsx"));
const DashboardPage = lazy(() => import("./assets/pages/DashboardPage.jsx"));
const CatalogPage = lazy(() => import("./assets/pages/CatalogPage.jsx"));
const UsuariosPage = lazy(() => import("./assets/pages/UsuariosPage.jsx"));

// Componente de carga
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Iniciando sistema seguro...</p>
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [userRole]);

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
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

          {userRole ? (
            <>
              <Route path="/home" element={<HomePage userRole={userRole} onLogout={handleLogout} />} />
              <Route path="/ventas" element={<VentasPage userRole={userRole} />} />
              <Route path="/inventario" element={<InventarioPage userRole={userRole} />} />
              <Route path="/finanzas" element={<FinanzasPage userRole={userRole} />} />

              {userRole !== 'Tienda' && userRole !== 'tienda' && userRole !== 'empleado_tienda' && (
                <>
                  <Route path="/compras" element={<ComprasPage userRole={userRole} />} />
                  <Route path="/fabricacion" element={<FabricacionPage userRole={userRole} />} />
                  <Route path="/logistica" element={<LogisticaPage userRole={userRole} />} />
                  <Route path="/admin-catalogo" element={<AdminCatalogPage userRole={userRole} />} />
                  <Route path="/reportes-diarios" element={<ReportesDiarios userRole={userRole} />} />
                  <Route path="/reportes" element={<ReportesPage userRole={userRole} />} />
                  <Route path="/dashboard" element={<DashboardPage userRole={userRole} />} />
                  {userRole === 'admin' && <Route path="/usuarios" element={<UsuariosPage userRole={userRole} />} />}
                </>
              )}
              <Route path="*" element={<Navigate to="/home" replace />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </Suspense>
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