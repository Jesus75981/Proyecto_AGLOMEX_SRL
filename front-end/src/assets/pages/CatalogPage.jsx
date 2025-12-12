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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md h-[80vh] flex flex-col shadow-2xl animate-fade-in-up">
        {/* Header Fijo */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-white rounded-t-xl">
          <h2 className="text-2xl font-bold text-green-700 flex items-center gap-2">
            🛒 Tu Carrito
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Lista Scrollable */}
        <div className="flex-grow overflow-y-auto p-5 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                <span className="text-6xl grayscale opacity-50">🛒</span>
                <p className="text-lg font-medium">Tu carrito está vacío</p>
                <button onClick={() => setIsOpen(false)} className="text-green-600 hover:underline font-medium">
                    Explorar productos
                </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-200 transition-colors">
                  <div className="flex-1 min-w-0 mr-4">
                    <h3 className="text-gray-800 font-semibold truncate">{item.product.nombre}</h3>
                    <p className="text-green-600 text-sm font-medium">Bs {(item.product.precioVenta || 0).toFixed(2)} c/u</p>
                  </div>
                  
                  <div className="flex items-center bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                    <button
                      onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                      className="text-gray-500 hover:text-green-600 px-2 py-1 transition-colors font-bold"
                    >
                      -
                    </button>
                    <span className="text-gray-800 font-mono w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                      className="text-gray-500 hover:text-green-600 px-2 py-1 transition-colors font-bold"
                    >
                      +
                    </button>
                  </div>
                  
                  <button
                    onClick={() => removeFromCart(item.product._id)}
                    className="ml-3 text-gray-400 hover:text-red-500 p-1 transition-colors"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Fijo (Sticky Bottom) */}
        {cart.length > 0 && (
          <div className="p-5 bg-gray-50 border-t border-gray-200 rounded-b-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-baseline mb-4">
                <span className="text-gray-600 font-medium">Total a pagar:</span>
                <span className="text-2xl font-bold text-gray-900">Bs {total.toFixed(2)}</span>
            </div>
            <button
              onClick={handleWhatsAppCheckout}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-green-600/20 hover:shadow-green-600/40 hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <span>📲</span> Pedir por WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Product Details Modal Component ---
const ProductDetailsModal = ({ product, isOpen, onClose, onAddToCart, onViewAR }) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-auto max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl relative animate-scale-up">
        
        {/* Close Button Mobile */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden z-10 bg-white/80 p-2 rounded-full shadow-md text-gray-600"
        >
          ✕
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center p-6 relative group overflow-hidden">
            {product.imagen ? (
                <img 
                  src={product.imagen && product.imagen.startsWith('http') ? product.imagen : `http://localhost:5000${product.imagen}`} 
                  alt={product.nombre} 
                  className="max-h-[60vh] object-contain transition-transform duration-500 group-hover:scale-105 mix-blend-multiply"
                />
            ) : (
                <div className="text-6xl opacity-20">🪑</div>
            )}
             {/* Tag de Categoría flotante */}
             <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                {product.categoria || 'General'}
             </span>
        </div>

        {/* Info Section */}
        <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto">
            {/* Header Desktop Close */}
            <div className="hidden md:flex justify-end mb-2">
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl transition-colors">✕</button>
            </div>

            <div className="flex-grow">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{product.nombre}</h2>
                <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-3xl font-extrabold text-green-700">Bs {product.precioVenta || '0.00'}</span>
                    <span className="text-sm text-gray-500 font-medium">Precio final</span>
                </div>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Descripción</h3>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            {product.descripcion || "Este producto es un ejemplo de la calidad y diseño que ofrece Aglomex SRL. Fabricado con los mejores materiales melamínicos."}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="block text-xs text-gray-500 font-bold uppercase mb-1">Dimensiones</span>
                            <span className="text-gray-800 font-medium text-sm">
                                {product.alto || '?'}cm x {product.ancho || '?'}cm x {product.profundidad || '?'}cm
                            </span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                             <span className="block text-xs text-gray-500 font-bold uppercase mb-1">Disponibilidad</span>
                             <span className="text-green-600 font-bold text-sm flex items-center gap-1">
                                ● En Stock
                             </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <button
                    onClick={() => onAddToCart(product)}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                  >
                    <span>🛒</span> Agregar
                  </button>

                  <button
                    onClick={() => {
                        onViewAR(product);
                        onClose();
                    }}
                    disabled={!product.objeto3D?.glbUrl}
                    className={`flex-1 font-bold py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 border-2 ${
                        product.objeto3D?.glbUrl 
                        ? 'bg-white border-green-600 text-green-700 hover:bg-green-50' 
                        : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <span>🧊</span> {product.objeto3D?.glbUrl ? 'Ver en 3D' : 'No disponible'}
                  </button>
            </div>
        </div>
      </div>
    </div>
  );
};


// --- Product Card Component ---
const ProductCard = ({ product, addToCart, onViewAR, onViewDetails }) => (
  <div 
    onClick={() => onViewDetails(product)}
    className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 cursor-pointer relative"
  >
    {/* Imagen */}
    <div className="relative h-64 overflow-hidden bg-gray-100 flex items-center justify-center p-4">
      {product.imagen ? (
        <img
          src={product.imagen && product.imagen.startsWith('http') ? product.imagen : `http://localhost:5000${product.imagen}`}
          alt={product.nombre}
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110 mix-blend-multiply"
        />
      ) : (
        <span className="text-6xl opacity-20">image</span>
      )}
      
      {/* Overlay al hacer hover (Desktop) */}
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="bg-white/90 backdrop-blur text-gray-800 px-4 py-2 rounded-full font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 text-sm">
                Ver Detalles
            </span>
      </div>

      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
         <button
            onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
            }}
            className="bg-gray-900 text-white p-2.5 rounded-full shadow-lg hover:bg-gray-800 hover:scale-110 transition-all"
            title="Añadir rápido"
         >
            🛒
         </button>
      </div>
    </div>

    {/* Info */}
    <div className="p-5">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-gray-800 group-hover:text-green-700 transition-colors line-clamp-1">{product.nombre}</h3>
       
      </div>
       <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">
        {product.descripcion || "Mueble de alta calidad Aglomex."}
      </p>
      
      <div className="flex items-center justify-between mt-4">
        <span className="text-2xl font-extrabold text-green-700">Bs {product.precioVenta || '0.00'}</span>
        
        {product.objeto3D && product.objeto3D.glbUrl && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewAR(product); }}
            className="text-xs bg-green-100 text-green-800 px-3 py-1.5 rounded-full font-bold uppercase tracking-wide flex items-center gap-1 hover:bg-green-200 transition-colors"
          >
           🧊 3D/AR
          </button>
        )}
      </div>
    </div>
  </div>
);

// --- Main Catalog Page ---
const CatalogPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // AR functionality
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // New States for Filters and Modal
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [availableCategories, setAvailableCategories] = useState(["Todas"]);
  
  // Modal Details State
  const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsRes = await fetch('http://localhost:5000/api/productos?disponibles=true');
        if (!productsRes.ok) throw new Error('Failed to fetch products');
        
        const productsData = await productsRes.json();
        setProducts(productsData);

        // Extract unique categories from products
        const categories = ["Todas", ...new Set(productsData.map(p => p.categoria).filter(Boolean))];
        setAvailableCategories(categories);

        setLoading(false);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product._id === product._id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    // Optional: Abrir carrito al añadir
    // setIsCartOpen(true); 
  };

  const handleViewAR = (product) => {
    if (product.objeto3D && product.objeto3D.glbUrl) {
      setSelectedProduct(product);
    } else {
      alert('Este producto no tiene modelo 3D disponible.');
    }
  };

  const handleViewDetails = (product) => {
    setSelectedDetailProduct(product);
    setIsDetailsOpen(true);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Filter Logic
  const filteredProducts = products.filter(product => {
      const matchesSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (product.descripcion && product.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === "Todas" || product.categoria === selectedCategory;
      return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-green-200">
      
      {/* 3D Model Viewer Overlay */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col justify-center items-center backdrop-blur-sm">
          <button 
            onClick={() => setSelectedProduct(null)}
            className="absolute top-5 right-5 text-white bg-gray-800 hover:bg-gray-700 rounded-full p-2 w-12 h-12 flex items-center justify-center transition-all z-50 text-2xl font-bold"
          >
            ✕
          </button>
          <model-viewer
            src={selectedProduct.objeto3D.glbUrl}
            ios-src=""
            alt={`Modelo 3D de ${selectedProduct.nombre}`}
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            ar-scale="auto"
            ar-placement="floor"
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          >
             <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-6 py-2 rounded-full pointer-events-none backdrop-blur-md font-medium text-sm text-center">
                 Arrastra para rotar • Pellizca para zoom
                 <span className="block text-xs opacity-75 mt-1 sm:hidden">Toca el botón AR para ver en tu espacio</span>
                 <span className="hidden sm:block text-xs opacity-75 mt-1 text-yellow-300">Para ver en Realidad Aumentada, abre esta página en tu celular.</span>
             </div>

             <button slot="ar-button" className="absolute bottom-6 right-6 bg-white text-gray-900 font-bold py-3 px-6 rounded-full shadow-xl flex items-center gap-2 transform hover:scale-105 transition-all text-sm z-50">
                <span>🧊</span> Ver en tu espacio
             </button>
          </model-viewer>
        </div>
      )}

      <CartModal 
        cart={cart} 
        setCart={setCart} 
        isOpen={isCartOpen} 
        setIsOpen={setIsCartOpen} 
      />
      
      <ProductDetailsModal 
        product={selectedDetailProduct} 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)}
        onAddToCart={addToCart}
        onViewAR={handleViewAR}
      />

      {/* Floating Cart Button (FAB) */}
      <button
        onClick={() => setIsCartOpen(true)}
        className={`fixed bottom-6 right-6 z-40 bg-green-600 hover:bg-green-500 text-white rounded-full p-4 shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center border-4 border-white group ${cartCount === 0 ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
        title="Ver Carrito"
      >
        <span className="text-2xl">🛒</span>
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white animate-bounce-short">
            {cartCount}
          </span>
        )}
      </button>

      <div className="container mx-auto px-4 py-8">
        {/* ... Header ... */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 border-b border-gray-200 pb-6">
           <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-green-700 tracking-tight mb-2">
                Catálogo <span className="text-gray-900">Aglomex</span>
              </h1>
              <p className="text-gray-500 text-lg font-light">Calidad y diseño para tu hogar</p>
           </div>
           
           <div className="flex items-center gap-4 mt-4 sm:mt-0">
             <button
                onClick={() => navigate('/home')}
                className="text-gray-500 hover:text-green-700 font-medium transition-colors"
             >
                Inicio
             </button>
             <button
               onClick={() => setIsCartOpen(true)}
               className="relative bg-white text-gray-800 p-3 rounded-full hover:bg-gray-100 transition-all shadow-sm border border-gray-200 group"
             >
               <span className="text-2xl group-hover:scale-110 block transition-transform">🛒</span>
               {cartCount > 0 && (
                 <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                   {cartCount}
                 </span>
               )}
             </button>
           </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-4 z-30 opacity-95 backdrop-blur">
             {/* Search */}
             <div className="relative w-full md:w-96">
                 <input 
                    type="text" 
                    placeholder="Buscar muebles..." 
                    className="w-full bg-gray-50 text-gray-800 border border-gray-200 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
                 <span className="absolute left-3 top-3.5 text-gray-400 text-lg">🔍</span>
             </div>

             {/* Categories */}
             <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
                 {availableCategories.map(cat => (
                     <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all border ${
                            selectedCategory === cat 
                            ? 'bg-green-600 text-white border-green-600 shadow-md' 
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                     >
                        {cat}
                     </button>
                 ))}
             </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-10 bg-white rounded-xl shadow-sm border border-red-100">
             <span className="text-4xl block mb-2">⚠️</span>
             <p className="font-bold">{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-20 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center">
                 <span className="text-6xl mb-4 opacity-50">🛋️</span>
                 <p className="text-xl font-medium">No encontramos productos con esos criterios.</p>
                 <button 
                  onClick={() => {setSearchTerm(""); setSelectedCategory("Todas");}}
                  className="mt-4 text-green-600 hover:text-green-700 font-bold hover:underline"
                 >
                    Ver todos los productos
                 </button>
            </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product._id} 
                product={product} 
                addToCart={addToCart} 
                onViewAR={handleViewAR}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>

       {/* Footer Simple */}
        <footer className="mt-20 py-10 border-t border-gray-200 text-center text-gray-400 bg-white">
            <p>© 2024 Aglomex SRL - Muebles de Melamina</p>
        </footer>
    </div>
  );
};

export default CatalogPage;
