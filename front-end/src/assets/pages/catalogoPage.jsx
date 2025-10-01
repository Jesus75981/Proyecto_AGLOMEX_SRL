import React, { useState, useEffect } from 'react';

// --- Función para simular la activación de Realidad Aumentada ---
const handleARView = (productName) => {
    // Nota: Reemplazar 'alert' por un modal o una lógica de RA real (ej. <model-viewer> con AR)
    alert(`Activando Realidad Aumentada para: ${productName}. ¡Mira a tu alrededor!`);
    console.log(`[RA ACTIVA]: Solicitando cámara para visualizar ${productName} en Realidad Aumentada.`);
};

// --- Mock Data (Se usa si falla la conexión a la API) ---
const MOCK_PRODUCTS = [
    { 
        _id: 'mock1', 
        name: "Sofá Modular 'Leda'", 
        descripcion: "Diseño elegante y modular, con tapicería de terciopelo y patas de roble macizo. Tipo: Sofá.", 
        precioVenta: 1299.99,
        imagen: "https://placehold.co/400x300/f97316/ffffff?text=Sofá+Modular",
        dimensiones: { alto: 240, ancho: 160, profundidad: 80 },
        modelUrl: "sofa_leda.glb",
        cantidad: 5, // Usamos 'cantidad' según tu esquema de MongoDB
        activo: true, 
        ventasAcumuladas: 250
    },
    { 
        _id: 'mock2', 
        name: "Mesa de Centro 'Orus'", 
        descripcion: "Mesa de centro con tablero de mármol blanco y estructura geométrica de metal negro. Tipo: Mesa.", 
        precioVenta: 450.00,
        imagen: "https://placehold.co/400x300/ea580c/ffffff?text=Mesa+de+Centro",
        dimensiones: { alto: 100, ancho: 50, profundidad: 45 },
        modelUrl: "mesa_orus.glb",
        cantidad: 0, // Agotado
        activo: true,
        ventasAcumuladas: 50 
    },
    { 
        _id: 'mock3', 
        name: "Estantería 'Charon'", 
        descripcion: "Estantería industrial abierta con cinco niveles, ideal para libros y decoración. Tipo: Estantería.", 
        precioVenta: 320.50,
        imagen: "https://placehold.co/400x300/fb923c/ffffff?text=Estantería+Industrial",
        dimensiones: { alto: 180, ancho: 80, profundidad: 30 },
        modelUrl: "estanteria_charon.glb",
        cantidad: 12, 
        activo: true,
        ventasAcumuladas: 150
    },
    { 
        _id: 'mock4', 
        name: "Silla de Comedor 'Zephyr'", 
        descripcion: "Silla de diseño escandinavo con asiento acolchado de tela gris y estructura de haya. Tipo: Silla.", 
        precioVenta: 89.99,
        imagen: "https://placehold.co/400x300/f97316/ffffff?text=Silla+Comedor",
        dimensiones: { alto: 45, ancho: 55, profundidad: 90 },
        modelUrl: "silla_zephyr.glb",
        cantidad: 2, 
        activo: true,
        ventasAcumuladas: 200
    },
];

// --- Componentes Reutilizados ---

const Navbar = () => {
  // Función simulada para "Ingresar"
  const handleIngresar = () => {
      // Usar un modal o redirigir en una aplicación real
      alert("Redirigiendo a la pantalla de inicio de sesión. (Simulación)");
      console.log("Intento de ingreso al sistema...");
  };

  return (
    <nav className="bg-gray-800 p-4 rounded-lg shadow-2xl mb-8">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white font-bold text-2xl">
          {/* Nombre del Sistema */}
          <span className="cursor-pointer hover:text-orange-500 transition-colors duration-300">Muebles 2025</span>
        </div>
        
        <div className="flex space-x-4 items-center"> 
          {/* Enlaces de acceso público */}
          <span className="cursor-pointer text-orange-400 font-semibold transition-colors duration-300 text-sm sm:text-base">
            Catálogo
          </span>
          <span className="cursor-pointer text-gray-300 hover:text-white transition-colors duration-300 text-sm sm:text-base">
            Logística
          </span>
          
          {/* Botón de Ingreso (Solo para administradores/empleados) */}
          <button
            onClick={handleIngresar}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 shadow-md text-sm sm:text-base"
          >
            Ingresar
          </button>
        </div>
      </div>
    </nav>
  );
};

// --- Componente de Tarjeta de Producto (Reutilizable para Catálogo y Más Vendidos) ---
const ProductCard = ({ product }) => {
    // Formatea las dimensiones si existen, usando tu estructura de esquema (alto, ancho, profundidad)
    const formattedDimensions = product.dimensiones 
        ? `${product.dimensiones.alto || 'N/D'}x${product.dimensiones.ancho || 'N/D'}x${product.dimensiones.profundidad || 'N/D'} cm` 
        : 'N/D';

    return (
        <div 
            key={product._id} 
            className="bg-gray-800 rounded-xl p-0 overflow-hidden shadow-2xl transition-all duration-300 hover:shadow-orange-500/30 hover:scale-[1.02] flex flex-col h-full"
        >
            
            {/* Imagen/Placeholder del Producto */}
            <img 
                src={product.imagen} 
                alt={product.nombre} // Usar 'nombre' según tu esquema
                className="w-full h-48 object-cover rounded-t-xl"
                onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src="https://placehold.co/400x300/374151/ffffff?text=Imagen+No+Disp."; // Fallback si la URL falla
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
                    ${product.precioVenta ? product.precioVenta.toFixed(2) : 'N/A'}
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                    <span>
                        Dimensiones: {formattedDimensions}
                    </span>
                    {/* Muestra el stock disponible usando 'cantidad' */}
                    <span className={`font-medium ${product.cantidad > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        Stock: {product.cantidad !== undefined ? product.cantidad : 'N/D'}
                    </span>
                </div>

                {/* Muestra las ventas acumuladas (para Top Sellers) */}
                {product.ventasAcumuladas !== undefined && (
                    <div className="text-sm font-bold text-yellow-400 mb-2 text-center">
                        Vendidas: {product.ventasAcumuladas} unidades
                    </div>
                )}

                {/* Botón de Realidad Aumentada (RA) - Se oculta o deshabilita si no hay stock */}
                <button
                    onClick={() => handleARView(product.nombre)}
                    disabled={product.cantidad !== undefined && product.cantidad <= 0}
                    className={`mt-auto font-bold py-2 px-4 rounded-lg transition-colors duration-300 w-full shadow-lg flex items-center justify-center space-x-2 
                        ${product.cantidad !== undefined && product.cantidad <= 0 
                            ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                            : 'bg-orange-600 hover:bg-orange-700 text-white'}`}
                >
                    {/* Icono de Cámara para RA */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-cube-with-ray">
                        <rect width="16" height="16" x="4" y="4" rx="2" ry="2"/>
                        <path d="M16 8H8a2 2 0 1 0 0 4h8a2 2 0 1 1 0 4H8"/>
                        <path d="M12 4v16"/>
                        <path d="M21 17h-3"/>
                        <path d="M21 7h-3"/>
                        <path d="M3 7h3"/>
                        <path d="M3 17h3"/>
                    </svg>
                    <span>Ver en RA</span>
                </button>
                {product.cantidad !== undefined && product.cantidad <= 0 && (
                    <p className="text-center text-red-400 text-sm mt-2 font-semibold">
                        ¡Agotado!
                    </p>
                )}
            </div>
        </div>
    );
};

// --- Componente Principal ---

const CatalogPage = () => {
  const [allProducts, setAllProducts] = useState([]); 
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [topSellers, setTopSellers] = useState([]); 
  
  // URL de tu API de productos (ajustar si tu puerto es diferente)
  // Esta URL debe apuntar al endpoint de tu backend de MongoDB
  const API_URL = 'http://localhost:5000/api/productos'; 

  // 1. Conexión y Lectura de datos desde la API (MongoDB)
  useEffect(() => {
    const fetchData = async () => {
        try {
            const response = await fetch(API_URL);
            
            if (!response.ok) {
                // Si la respuesta no es 200 (ej. 404, 500)
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();

            // Usamos 'nombre' y 'cantidad' según tu esquema de MongoDB
            const activeProducts = data.filter(p => p.activo !== false);

            setAllProducts(activeProducts);
            setLoading(false);
            setError(null); 

            if (activeProducts.length === 0) {
                // Si la API devuelve una lista vacía
                setAllProducts(MOCK_PRODUCTS.filter(p => p.activo !== false));
                setError("La base de datos de MongoDB devolvió un array vacío. Mostrando datos de ejemplo.");
            }

        } catch (fetchError) {
            // Manejo de errores de conexión de red o HTTP
            console.error("Fetch Error:", fetchError);
            setError(`Error al conectar con la API (${API_URL}). Verifique el servidor. Mostrando datos de ejemplo.`);
            // Usar datos mock si hay un error de conexión
            setAllProducts(MOCK_PRODUCTS.filter(p => p.activo !== false));
            setLoading(false);
        }
    };

    fetchData();
    // Nota: Para una actualización en tiempo real se requeriría WebSockets o polling. 
    // Por ahora, se actualiza al recargar la página.
  }, []); 

  // 2. Efecto para manejar la búsqueda, el filtro de stock y el cálculo de los más vendidos
  useEffect(() => {
    // 1. Filtrar por Stock (solo mostrar si 'cantidad' > 0 o si no tiene propiedad 'cantidad')
    const availableProducts = allProducts.filter(p => p.cantidad === undefined || p.cantidad > 0);

    // 2. Calcular TOP VENDEDORES (se hace sobre los productos DISPONIBLES)
    const sortedBySales = [...availableProducts] // Copia para no mutar el estado original
        .sort((a, b) => (b.ventasAcumuladas || 0) - (a.ventasAcumuladas || 0));
    
    // Tomar los 4 mejores
    setTopSellers(sortedBySales.slice(0, 4));

    // 3. Filtrar por término de búsqueda (case insensitive)
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const filteredAndSearchedProducts = availableProducts.filter(product => {
      // Usamos 'nombre' y 'descripcion' según tu esquema
      const nameMatch = product.nombre?.toLowerCase().includes(lowerCaseSearchTerm);
      const descriptionMatch = product.descripcion?.toLowerCase().includes(lowerCaseSearchTerm);
      
      return nameMatch || descriptionMatch;
    });

    setProducts(filteredAndSearchedProducts);
  }, [allProducts, searchTerm]); 

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <p className="text-white text-2xl">Conectando con la API y cargando catálogo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8 font-sans">
      <Navbar />
      <div className="container mx-auto">
        
        {/* Cabecera del Módulo y Búsqueda */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
          <div>
            <h1 className="text-5xl font-extrabold text-orange-500 mb-2">
              Catálogo de Diseño 
            </h1>
            <p className="text-gray-400 text-lg">
              Explora nuestros modelos AR y especificaciones de fabricación.
            </p>
          </div>
          {/* Campo de Búsqueda */}
          <input
            type="text"
            placeholder="Buscar por Silla, Sofá, Mesa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-4 sm:mt-0 p-3 w-full sm:w-80 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-300 placeholder-gray-400"
          />
        </div>
        
        {error && (
          <div className="bg-red-800 text-white p-4 rounded-lg mb-6 text-center shadow-lg">{error}</div>
        )}

        {/* --- SECCIÓN: PRODUCTOS MÁS VENDIDOS --- */}
        {topSellers.length > 0 && (
            <div className="mb-12">
                <h2 className="text-4xl font-bold text-yellow-400 mb-6 border-b-2 border-yellow-500/50 pb-2">
                    Lo más popular
                </h2>
                {/* Carrusel simulado con grid overflow */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto">
                    {topSellers.map((product) => (
                        <ProductCard key={product._id} product={product} />
                    ))}
                </div>
            </div>
        )}
        {/* --- FIN SECCIÓN: PRODUCTOS MÁS VENDIDOS --- */}

        <h2 className="text-4xl font-bold text-orange-500 mb-6 border-b-2 border-orange-500/50 pb-2">
            Catálogo Completo
        </h2>

        {/* Grid de Productos Filtrados y Buscados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))
          ) : (
            <p className="col-span-full text-center text-xl text-gray-500 p-10">
              No se encontraron productos con existencias disponibles que coincidan con la búsqueda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;
