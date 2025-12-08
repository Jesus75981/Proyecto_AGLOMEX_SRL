# TODO: Confirmación de Recepción de Pedido con Logística

## Información Recopilada
- El sistema ya tiene una función `confirmarRecepcionPedido` en `pedidos.controller.js`.
- Modelo Pedido tiene `pedidoNumero`, `estado`, `fechaEntrega`.
- Modelo Logistica tiene `pedido` (ref a Pedido), `estado` (pendiente, en_camino, entregado), `fechaEntregaEstimada`.
- Necesita verificar estado 'entregado' en logística.
- Verificar fechaEntrega del pedido <= fecha actual.
- Incluir historial de logística (todos los envíos relacionados).

## Plan
- [] Modificar `confirmarRecepcionPedido` en `pedidos.controller.js`:
  - Buscar pedido por `pedidoNumero`.
  - Buscar logística por `pedido: pedido._id` y verificar `estado: 'entregado'`.
  - Verificar `pedido.fechaEntrega <= new Date()`.
  - Si ok, actualizar pedido a 'entregado'.
  - Devolver pedido, logística, y historial (todas las logisticas del pedido).
- [] Corregir búsqueda en `obtenerPedidoPorNumero` si necesario (busca pedidoNumero en Logistica, pero Logistica no lo tiene).
- [] Probar la funcionalidad.

## Archivos Dependientes
- back-end/controllers/pedidos.controller.js
- back-end/models/pedido.model.js
- back-end/models/logistica.model.js

## Seguimiento
- [] Implementar cambios.
- [] Verificar integración con rutas.
- [] Probar endpoint.
