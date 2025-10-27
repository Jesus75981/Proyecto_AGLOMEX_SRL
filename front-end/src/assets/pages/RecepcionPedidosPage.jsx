import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Componente Principal RecepcionPedidosPage
const RecepcionPedidosPage = () => {
  const navigate = useNavigate();
  const [pedidoNumero, setPedidoNumero] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [pedidoInfo, setPedidoInfo] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('');

  const handleConsultarEstado = async (e) => {
    e.preventDefault();

    if (!pedidoNumero.trim()) {
      setMessage('Por favor ingrese el número de pedido');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setPedidoInfo(null);
    setShowConfirm(false);

    try {
      const response = await axios.get(`http://localhost:5000/api/pedidos-publico/numero/${pedidoNumero.trim()}`);
      setPedidoInfo(response.data);
      setMessage('Pedido encontrado. Puede confirmar recepción si ya lo recibió.');
      setMessageType('success');
      setShowConfirm(true);
    } catch (error) {
      console.error('Error:', error);
      if (error.response && error.response.status === 404) {
        setMessage('Pedido no encontrado. Verifique el número e intente nuevamente.');
      } else {
        setMessage('Error al consultar el pedido. Por favor intente nuevamente.');
      }
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarRecepcion = async (e) => {
    e.preventDefault();

    if (!pedidoNumero.trim()) {
      setMessage('Por favor ingrese el número de pedido');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/pedidos-publico/confirmar-recepcion', {
        pedidoNumero: pedidoNumero.trim()
      });

      setMessage('¡Recepción confirmada exitosamente! Gracias por su compra.');
      setMessageType('success');
      setPedidoNumero('');
      setPedidoInfo(null);
      setShowConfirm(false);
      setNombre('');
      setTelefono('');
      setCiudad('');
    } catch (error) {
      console.error('Error:', error);
      if (error.response) {
        setMessage(error.response.data.message || 'Error al confirmar recepción');
      } else {
        setMessage('Error de conexión. Por favor intente nuevamente.');
      }
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoTexto = (estado) => {
    const estados = {
      'pendiente': 'Pendiente',
      'en_produccion': 'En Producción',
      'despachado': 'Despachado',
      'entregado': 'Entregado'
    };
    return estados[estado] || estado;
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'pendiente': 'text-yellow-400',
      'en_produccion': 'text-blue-400',
      'despachado': 'text-orange-400',
      'entregado': 'text-green-400'
    };
    return colores[estado] || 'text-gray-400';
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
              onClick={() => window.open('/catalogo', '_blank')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Catálogo
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

      {/* Contenido Principal */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-orange-500 mb-4">
              Confirmación de Recepción de Pedido
            </h1>
            <p className="text-gray-300 text-lg">
              Confirme que ha recibido su pedido exitosamente
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-8 shadow-2xl">
            <form onSubmit={handleConsultarEstado} className="space-y-6">
              <div>
                <label htmlFor="pedidoNumero" className="block text-sm font-medium text-gray-300 mb-2">
                  Número de Pedido
                </label>
                <input
                  type="text"
                  id="pedidoNumero"
                  value={pedidoNumero}
                  onChange={(e) => setPedidoNumero(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  placeholder="Ingrese el número de su pedido"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-lg ${
                  loading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {loading ? 'Consultando...' : 'Consultar Estado'}
              </button>
            </form>

            {pedidoInfo && (
              <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
                <h3 className="text-lg font-bold text-orange-400 mb-3">Información del Pedido</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium text-gray-300">Número:</span> {pedidoInfo.pedidoNumero}</p>
                  <p><span className="font-medium text-gray-300">Estado:</span> <span className={`font-bold ${getEstadoColor(pedidoInfo.estado)}`}>{getEstadoTexto(pedidoInfo.estado)}</span></p>
                  <p><span className="font-medium text-gray-300">Fecha de Pedido:</span> {new Date(pedidoInfo.fechaPedido).toLocaleDateString()}</p>
                  {pedidoInfo.fechaEntrega && (
                    <p><span className="font-medium text-gray-300">Fecha de Entrega:</span> {new Date(pedidoInfo.fechaEntrega).toLocaleDateString()}</p>
                  )}

                  <p><span className="font-medium text-gray-300">Productos:</span></p>
                  <ul className="ml-4 list-disc text-gray-400">
                    {pedidoInfo.productos?.map((item, index) => (
                      <li key={index}>
                        {item.producto?.nombre || 'Producto'} (Cantidad: {item.cantidad})
                      </li>
                    )) || <li>No hay productos</li>}
                  </ul>
                </div>
              </div>
            )}

            {showConfirm && pedidoInfo?.estado !== 'entregado' && (
              <div className="mt-6">
                <form onSubmit={handleConfirmarRecepcion} className="space-y-4">
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                      placeholder="Ingrese su nombre completo"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-300 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                      placeholder="Ingrese su número de teléfono"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="ciudad" className="block text-sm font-medium text-gray-300 mb-2">
                      Ciudad (Departamento)
                    </label>
                    <select
                      id="ciudad"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                      disabled={loading}
                      required
                    >
                      <option value="">Seleccione su departamento</option>
                      <option value="Chuquisaca">Chuquisaca</option>
                      <option value="La Paz">La Paz</option>
                      <option value="Cochabamba">Cochabamba</option>
                      <option value="Oruro">Oruro</option>
                      <option value="Potosí">Potosí</option>
                      <option value="Tarija">Tarija</option>
                      <option value="Santa Cruz">Santa Cruz</option>
                      <option value="Beni">Beni</option>
                      <option value="Pando">Pando</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-lg ${
                      loading
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {loading ? 'Confirmando...' : 'Confirmar Recepción'}
                  </button>
                </form>
              </div>
            )}

            {message && (
              <div className={`mt-6 p-4 rounded-lg ${
                messageType === 'success'
                  ? 'bg-green-900 border border-green-700 text-green-200'
                  : 'bg-red-900 border border-red-700 text-red-200'
              }`}>
                <p className="text-center font-medium">{message}</p>
              </div>
            )}
          </div>

          {/* Información de Contacto */}
          <div className="mt-8 bg-gray-800 rounded-lg p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-orange-500 mb-4 text-center">
              ¿Tiene algún reclamo?
            </h2>
            <p className="text-gray-300 text-center mb-4">
              Si tiene algún problema con su pedido o necesita hacer un reclamo,
              por favor contáctenos directamente.
            </p>
            <div className="text-center">
              <a
                href="https://wa.me/1234567890?text=Hola,%20tengo%20un%20reclamo%20sobre%20mi%20pedido"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                Contactar por WhatsApp
              </a>
              <p className="text-gray-400 text-sm mt-2">
                Número: +1 (555) 123-4567
              </p>
            </div>
          </div>

          {/* Botón para volver */}
          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
            >
              ← Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecepcionPedidosPage;
