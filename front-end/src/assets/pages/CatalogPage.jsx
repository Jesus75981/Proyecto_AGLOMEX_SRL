import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Cart Modal Component ---
const CartModal = ({ cart, setCart, isOpen, setIsOpen }) => {
  const total = cart.reduce((sum, item) => sum + (item.product.precioVenta || 0) * item.quantity, 0);

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product._id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.product._id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleWhatsAppCheckout = () => {
    const orderDetails = cart.map(item =>
      `${item.product.nombre} x${item.quantity} - Bs ${((item.product.precioVenta || 0) * item.quantity).toFixed(2)}`
    ).join('\n');

    const message = `Hola, me gustaría hacer un pedido:\n\n${orderDetails}\n\nTotal: Bs ${total.toFixed(2)}\n\nPor favor, confirma la disponibilidad y detalles de entrega.`;

    const whatsappUrl = `https://wa.me/59172876225?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-orange-400">Carrito de Compras</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {cart.length === 0 ? (
          <p className="text-gray-400 text-center">Tu carrito está vacío</p>
        ) : (
          <>
            {cart.map(item => (
              <div key={item.product._id} className="flex items-center justify-between mb-4 p-3 bg-gray-700 rounded">
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{item.product.nombre}</h3>
                  <p className="text-gray-400">Bs {(item.product.precioVenta || 0).toFixed(2)} c/u</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded"
                  >
                    -
                  </button>
                  <span className="text-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeFromCart(item.product._id)}
                    className="bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded ml-2"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            <div className="border-t border-gray-600 pt-4 mt-4">
              <div className="flex justify-between text-xl font-bold text-white mb-4">
                <span>Total:</span>
                <span>Bs {total.toFixed(2)}</span>
              </div>
              <button
                onClick={handleWhatsAppCheckout}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300"
              >
                Pedir por WhatsApp
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- Componente Modal AR ---
const ARModal = ({ product, isOpen, onClose }) => {
  if (!isOpen || !product || !product.objeto3D?.glbUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-4 w-full max-w-4xl h-[80vh] relative flex flex-col shadow-2xl border border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-3xl z-10 bg-gray-900/50 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
        >
          ×
        </button>
        
        <h2 className="text-2xl font-bold text-orange-400 mb-4 text-center pr-10">{product.nombre} en 3D</h2>
        
        <div className="flex-grow w-full h-full bg-gray-900 rounded-lg overflow-hidden relative border border-gray-700">
          <model-viewer
            src={product.objeto3D.glbUrl}
            ios-src={product.objeto3D.usdzUrl || ''}
            alt={`Modelo 3D de ${product.nombre}`}
            ar
            ar-modes="scene-viewer webxr quick-look"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            style={{ width: '100%', height: '100%' }}
            className="w-full h-full"
          >
             <button slot="ar-button" className="absolute bottom-6 right-6 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-full shadow-lg z-20 flex items-center gap-2 transition-transform hover:scale-105">
                <span>📱</span> Ver en tu espacio
             </button>
          </model-viewer>
        </div>
        
        <p className="text-gray-400 text-center mt-4 text-sm">
          Usa tu celular para ver este producto en realidad aumentada.
        </p>
      </div>
    </div>
  );
};

// --- Componente Navbar ---
const Navbar = ({ cartCount, onCartClick }) => {
  const navigate = useNavigate();

  return (
    <nav className="bg-gray-800 p-4 rounded-lg shadow-2xl mb-8">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white font-bold text-2xl">
          <span className="hover:text-orange-500 transition-colors duration-300">
            Muebles 2025
          </span>
        </div>

        <div className="flex space-x-4 items-center">
          <span className="text-orange-400 font-semibold text-sm sm:text-base">
            Catálogo Público
          </span>

          <button
            onClick={onCartClick}
            className="relative bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md text-sm sm:text-base"
          >
            🛒 Carrito
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate('/recepcion-pedidos')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md text-sm sm:text-base"
          >
            Confirmar Recepción
          </button>

          <button
            onClick={() => navigate('/login')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md text-sm sm:text-base"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
};

// --- Componente de Tarjeta de Producto ---
const ProductCard = ({ product, onAddToCart, onViewAR }) => {
    const formattedDimensions = product.dimensiones
        ? `${product.dimensiones.alto || 'N/D'}x${product.dimensiones.ancho || 'N/D'}x${product.dimensiones.profundidad || 'N/D'} cm`
        : 'N/D';

    return (
        <div className="bg-gray-800 rounded-xl p-0 overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-orange-500/30 hover:scale-[1.02] flex flex-col h-full">

            <img
                src={product.imagen}
                alt={product.nombre}
                className="w-full h-48 object-cover rounded-t-xl"
                onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/400x300/374151/ffffff?text=Imagen+No+Disp.";
                }}
            />

            <div className="p-5 flex flex-col flex-grow">
                <h2 className="text-2xl font-bold text-orange-400 mb-2 truncate">
                    {product.nombre}
                </h2>

                <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-grow">
                    {product.descripcion}
                </p>

                <div className="text-lg font-semibold text-white mb-3">
                    Bs {product.precioVenta ? product.precioVenta.toFixed(2) : 'N/A'}
                </div>

                <div className="text-xs text-gray-500 mb-3">
                    Dimensiones: {formattedDimensions}
                </div>

                {product.objeto3D?.glbUrl && (
                    <button
                        onClick={() => onViewAR(product)}
                        className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/50 font-bold py-2 px-4 rounded-lg transition-all duration-300 mb-2 flex items-center justify-center gap-2 group"
                    >
                        <span className="group-hover:scale-110 transition-transform">🧊</span> Ver en 3D / AR
                    </button>
                )}

                <button
                    onClick={() => onAddToCart(product)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                >
                    Agregar al Carrito
                </button>
            </div>
        </div>
    );
};

// --- Componente Principal CatalogPage ---
const CatalogPage = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Estado para AR
  const [isAROpen, setIsAROpen] = useState(false);
  const [selectedARProduct, setSelectedARProduct] = useState(null);

  const handleViewAR = (product) => {
    setSelectedARProduct(product);
    setIsAROpen(true);
  };

  const API_URL = 'http://localhost:5000/api/productos';

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product._id === product._id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  useEffect(() => {
    const fetchData = async () => {
        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            const activeProducts = data.filter(p => p.activo !== false);

            setAllProducts(activeProducts);
            setLoading(false);
            setError(null);

        } catch (fetchError) {
            console.error("Fetch Error:", fetchError);
            setError(`Error al conectar con la API.`);
            setAllProducts([]);
            setLoading(false);
        }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const availableProducts = allProducts.filter(p => p.cantidad === undefined || p.cantidad > 0);

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const filteredAndSearchedProducts = availableProducts.filter(product => {
      const nameMatch = product.nombre?.toLowerCase().includes(lowerCaseSearchTerm);
      const descriptionMatch = product.descripcion?.toLowerCase().includes(lowerCaseSearchTerm);

      return nameMatch || descriptionMatch;
    });

    setProducts(filteredAndSearchedProducts);
  }, [allProducts, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white text-2xl">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans">
      <Navbar cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />
      <CartModal cart={cart} setCart={setCart} isOpen={isCartOpen} setIsOpen={setIsCartOpen} />
      <ARModal product={selectedARProduct} isOpen={isAROpen} onClose={() => setIsAROpen(false)} />
      <div className="container mx-auto">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
          <div>
            <h1 className="text-5xl font-extrabold text-orange-500 mb-2">
              Catálogo de Diseño
            </h1>
            <p className="text-gray-400 text-lg">
              Explora nuestros productos disponibles en inventario.
            </p>
          </div>

          <input
            type="text"
            placeholder="Buscar por Silla, Sofá, Mesa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-4 sm:mt-0 p-3 w-full sm:w-80 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-300 placeholder-gray-400"
          />
        </div>

        {error && (
          <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 p-4 rounded-lg mb-6 text-center shadow-lg">
            {error}
          </div>
        )}



        <div className="mb-8">
          <h2 className="text-4xl font-bold text-orange-500 mb-6 border-b-2 border-orange-500/50 pb-2">
            Catálogo Completo
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard 
                    key={product._id} 
                    product={product} 
                    onAddToCart={addToCart} 
                    onViewAR={handleViewAR}
                />
              ))
            ) : (
              <div className="col-span-full text-center p-10">
                <p className="text-xl text-gray-500 mb-4">
                  No se encontraron productos con existencias disponibles que coincidan con la búsqueda.
                </p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
                >
                  Limpiar búsqueda
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-400">
            © 2024 Muebles 2025 - Todos los derechos reservados
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Sistema de catálogo con Realidad Aumentada
          </p>
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;