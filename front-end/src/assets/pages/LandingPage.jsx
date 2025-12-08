import React from 'react';
import { useNavigate } from 'react-router-dom';
import Aglomex1 from '../images/Aglomex1.jpg';
import Aglomex2 from '../images/Aglomex2.jpg';
import Aglomex3 from '../images/Aglomex3.jpg';
import aglomex4 from '../images/aglomex4.jpg';
import aglomex5 from '../images/aglomex5.jpg';
import aglomex6 from '../images/aglomex6.jpg';
import aglomex7 from '../images/aglomex7.jpg';
import aglomex8 from '../images/aglomex8.jpg';
import aglomex9 from '../images/aglomex9.jpg';
import aglomex10 from '../images/aglomex10.jpg';
import aglomexblanco from '../images/aglomexblanco.jpg';

// Componente de Carrusel de Imágenes
const ImageCarousel = () => {
  const images = [
    Aglomex1,
    Aglomex2,
    Aglomex3,
    aglomex4,
    aglomex5,
    aglomex6,
    aglomex7,
    aglomex8,
    aglomex9,
    aglomex10,
    aglomexblanco
  ];

  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Cambia cada 3 segundos
    return () => clearInterval(interval);
  }, [images.length]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full h-96 overflow-hidden rounded-lg shadow-2xl">
      <img
        src={images[currentIndex]}
        alt={`Imagen ${currentIndex + 1}`}
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
        {images.map((_, index) => (
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <nav className="bg-gray-800 p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-white font-bold text-2xl">
            <span className="text-orange-500">Aglomex</span> SRL
          </div>
          <div className="flex space-x-4">
            <button
              onClick={openCatalog}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Catálogo
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
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
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
      <section className="py-16 px-4 bg-gray-800">
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
          <p className="text-lg text-gray-300 mb-6 max-w-4xl mx-auto">
            Fundada en 2020, Aglomex SRL se dedica a la fabricación y distribución de muebles contemporáneos.
            Nuestra pasión por el diseño innovador y la calidad artesanal nos ha convertido en referentes del sector.
            Utilizamos materiales sostenibles y técnicas avanzadas para crear piezas que combinan funcionalidad y estética.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-orange-500 mb-4">Misión</h3>
              <p className="text-gray-300">
                Proporcionar muebles de alta calidad que mejoren la vida cotidiana de nuestros clientes,
                combinando diseño innovador con sostenibilidad.
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-orange-500 mb-4">Visión</h3>
              <p className="text-gray-300">
                Ser la empresa líder en muebles con tecnología AR, expandiendo nuestra presencia
                nacional e internacional.
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-orange-500 mb-4">Valores</h3>
              <p className="text-gray-300">
                Calidad, innovación, sostenibilidad y compromiso con la satisfacción del cliente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section className="py-16 px-4 bg-gray-800">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-orange-500 mb-8">
            Nuestros Servicios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
              <span className="text-4xl mb-4 block">🪑</span>
              <h3 className="text-xl font-bold text-white mb-2">Diseño Personalizado</h3>
              <p className="text-gray-300 text-sm">
                Creamos muebles a medida según tus necesidades y preferencias.
              </p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
              <span className="text-4xl mb-4 block">🚚</span>
              <h3 className="text-xl font-bold text-white mb-2">Entrega a Domicilio</h3>
              <p className="text-gray-300 text-sm">
                Servicio de entrega rápida y segura en toda la región.
              </p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
              <span className="text-4xl mb-4 block">🔧</span>
              <h3 className="text-xl font-bold text-white mb-2">Instalación Profesional</h3>
              <p className="text-gray-300 text-sm">
                Nuestro equipo experto instala tus muebles con precisión.
              </p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
              <span className="text-4xl mb-4 block">🛡️</span>
              <h3 className="text-xl font-bold text-white mb-2">Garantía Extendida</h3>
              <p className="text-gray-300 text-sm">
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
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <span className="text-4xl mb-4 block">📍</span>
              <h3 className="text-xl font-bold text-white mb-2">Dirección</h3>
              <p className="text-gray-300">
                Calle Principal 123, Ciudad Industrial, País
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <span className="text-4xl mb-4 block">📞</span>
              <h3 className="text-xl font-bold text-white mb-2">Teléfono</h3>
              <p className="text-gray-300">
                +1 (555) 123-4567
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <span className="text-4xl mb-4 block">✉️</span>
              <h3 className="text-xl font-bold text-white mb-2">Email</h3>
              <p className="text-gray-300">
                info@aglomex.com
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-gray-400">
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
