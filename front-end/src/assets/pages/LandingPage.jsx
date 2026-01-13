import React from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';



// Componente de Carrusel de Imágenes de Productos
const ImageCarousel = () => {
  const [products, setProducts] = React.useState([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Cargar productos más vendidos
  React.useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/ventas/estadisticas`);
        const data = await response.json();

        // Obtener los productos más vendidos
        const topProducts = data.productosMasVendidos || [];

        // Filtrar solo productos con imagen
        const productsWithImages = topProducts.filter(p => p.imagen);

        setProducts(productsWithImages.slice(0, 10)); // Máximo 10 productos
        setLoading(false);
      } catch (error) {
        console.error('Error cargando productos:', error);
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  React.useEffect(() => {
    if (products.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
    }, 3000); // Cambia cada 3 segundos

    return () => clearInterval(interval);
  }, [products.length]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + products.length) % products.length);
  };

  if (loading) {
    return (
      <div className="relative w-full h-96 overflow-hidden rounded-lg shadow-2xl bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Cargando productos...</div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="relative w-full h-96 overflow-hidden rounded-lg shadow-2xl bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">No hay productos disponibles</div>
      </div>
    );
  }

  const currentProduct = products[currentIndex];

  return (
    <div className="relative w-full h-96 overflow-hidden rounded-lg shadow-2xl">
      <img
        src={currentProduct.imagen}
        alt={currentProduct._id}
        className="w-full h-full object-cover transition-opacity duration-500"
      />

      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
      >
        ‹
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
      >
        ›
      </button>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {products.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full ${index === currentIndex ? 'bg-orange-500' : 'bg-white bg-opacity-50'}`}
          />
        ))}
      </div>
    </div>
  );
};

// Componente Principal LandingPage
const LandingPage = () => {
  const navigate = useNavigate();

  const openCatalog = () => {
    navigate('/catalogo');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Navbar */}
      <nav className="bg-white p-4 shadow-lg border-b border-gray-200">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-gray-800 font-bold text-2xl">
            <span className="text-orange-500">Aglomex</span> SRL
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/catalogo')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Ver Catálogo
            </button>
            <button
              onClick={() => navigate('/recepcion-pedidos')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Confirmar Recepción
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-6xl font-extrabold text-orange-500 mb-6">
            Bienvenidos a Aglomex SRL
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Fabricantes líderes de muebles de alta calidad. Innovamos con diseño moderno y tecnología de Realidad Aumentada para una experiencia única.
          </p>
          <button
            onClick={openCatalog}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors duration-300 shadow-lg"
          >
            Explorar Catálogo
          </button>
        </div>
      </section>

      {/* Carrusel de Imágenes */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center text-orange-500 mb-8">
            Nuestros Productos
          </h2>
          <ImageCarousel />
        </div>
      </section>

      {/* Acerca de Nosotros */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-orange-500 mb-8">
            Acerca de Aglomex SRL
          </h2>
          <p className="text-lg text-gray-600 mb-6 max-w-4xl mx-auto">
            Fundada en 2020, Aglomex SRL se dedica a la fabricación y distribución de muebles contemporáneos.
            Nuestra pasión por el diseño innovador y la calidad artesanal nos ha convertido en referentes del sector.
            Utilizamos materiales sostenibles y técnicas avanzadas para crear piezas que combinan funcionalidad y estética.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-orange-500 mb-4">Misión</h3>
              <p className="text-gray-600">
                Proporcionar muebles de alta calidad que mejoren la vida cotidiana de nuestros clientes,
                combinando diseño innovador con sostenibilidad.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-orange-500 mb-4">Visión</h3>
              <p className="text-gray-600">
                Ser la empresa líder en muebles con tecnología AR, expandiendo nuestra presencia
                nacional e internacional.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-orange-500 mb-4">Valores</h3>
              <p className="text-gray-600">
                Calidad, innovación, sostenibilidad y compromiso con la satisfacción del cliente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="py-16 px-4 bg-gray-100">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-orange-500 mb-8">
            Nuestros Servicios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <span className="text-4xl mb-4 block">🪑</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Diseño Personalizado</h3>
              <p className="text-gray-600 text-sm">
                Creamos muebles a medida según tus necesidades y preferencias.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <span className="text-4xl mb-4 block">🚚</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Entrega a Domicilio</h3>
              <p className="text-gray-600 text-sm">
                Servicio de entrega rápida y segura en toda la región.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <span className="text-4xl mb-4 block">🔧</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Instalación Profesional</h3>
              <p className="text-gray-600 text-sm">
                Nuestro equipo experto instala tus muebles con precisión.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <span className="text-4xl mb-4 block">🛡️</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Garantía Extendida</h3>
              <p className="text-gray-600 text-sm">
                Ofrecemos garantía de calidad en todos nuestros productos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-orange-500 mb-8">
            Contáctanos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <span className="text-4xl mb-4 block">📍</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Dirección</h3>
              <p className="text-gray-600">
                Calle Principal 123, Ciudad Industrial, País
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <span className="text-4xl mb-4 block">📞</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Teléfono</h3>
              <p className="text-gray-600">
                +1 (555) 123-4567
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <span className="text-4xl mb-4 block">✉️</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Email</h3>
              <p className="text-gray-600">
                info@aglomex.com
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-gray-600">
            © 2024 Aglomex SRL - Todos los derechos reservados
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Fabricantes de muebles con pasión por el diseño
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
