import React, { useRef, useEffect, useState } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';

const MapComponent = ({ rutas, onRouteClick }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-64 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="text-center">
          <div className="text-yellow-600 text-lg mb-2">⚠️ Mapa no disponible</div>
          <div className="text-yellow-500 text-sm">
            La clave de API de Google Maps no está configurada.<br />
            Configure VITE_GOOGLE_MAPS_API_KEY en su archivo .env para habilitar el mapa.
          </div>
        </div>
      </div>
    );
  }

  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  useEffect(() => {
    if (mapRef.current && !map) {
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 4.6097, lng: -74.0817 }, // Centro de Colombia
        zoom: 6,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#f5f5f5' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#c9c9c9' }]
          }
        ]
      });

      const directionsServiceInstance = new window.google.maps.DirectionsService();
      const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
        map: googleMap,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#2563eb',
          strokeWeight: 4
        }
      });

      setMap(googleMap);
      setDirectionsService(directionsServiceInstance);
      setDirectionsRenderer(directionsRendererInstance);
    }
  }, [map]);

  useEffect(() => {
    if (map && directionsService && directionsRenderer && rutas.length > 0) {
      // Limpiar rutas anteriores
      directionsRenderer.setDirections({ routes: [] });

      // Dibujar cada ruta
      rutas.forEach((ruta, index) => {
        const request = {
          origin: ruta.origen,
          destination: ruta.destino,
          travelMode: window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false
        };

        directionsService.route(request, (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            // Crear un renderer separado para cada ruta
            const routeRenderer = new window.google.maps.DirectionsRenderer({
              map: map,
              directions: result,
              routeIndex: 0,
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: getRouteColor(index),
                strokeWeight: 4,
                strokeOpacity: 0.8
              }
            });

            // Agregar info window al hacer clic en la ruta
            routeRenderer.setOptions({
              suppressInfoWindows: false
            });

            // Agregar listener para clics en la ruta
            window.google.maps.event.addListener(routeRenderer, 'click', () => {
              if (onRouteClick) {
                onRouteClick(ruta);
              }
            });
          }
        });
      });

      // Ajustar el mapa para mostrar todas las rutas
      const bounds = new window.google.maps.LatLngBounds();
      rutas.forEach(ruta => {
        // Aquí podrías geocodificar las direcciones para ajustar bounds
        // Por simplicidad, centramos en Colombia
      });
      map.setCenter({ lat: 4.6097, lng: -74.0817 });
      map.setZoom(6);
    }
  }, [map, directionsService, directionsRenderer, rutas, onRouteClick]);

  const getRouteColor = (index) => {
    const colors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#0891b2'];
    return colors[index % colors.length];
  };

  const render = (status) => {
    switch (status) {
      case Status.LOADING:
        return <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <div className="text-gray-600">Cargando mapa...</div>
        </div>;
      case Status.FAILURE:
        return <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg">
          <div className="text-red-600">Error al cargar el mapa. Verifique su conexión a internet y la clave de API.</div>
        </div>;
      case Status.SUCCESS:
        return <div ref={mapRef} className="w-full h-64 rounded-lg" />;
    }
  };

  return (
    <Wrapper
      apiKey={apiKey}
      render={render}
      libraries={['geometry', 'drawing']}
    />
  );
};

export default MapComponent;
