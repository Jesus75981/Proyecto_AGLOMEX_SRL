# TODO: Implementar módulo de crear/buscar producto con categoría dinámica, cajas y ubicación

## Tareas Pendientes

### Backend
- [ ] Actualizar modelo productoTienda.model.js: Cambiar categoria de enum a string para permitir categorías dinámicas
- [ ] Agregar endpoint en productos.routes.js para obtener categorías únicas existentes
- [ ] Actualizar controlador productoTienda.controller.js si es necesario para manejar categorías nuevas

### Frontend
- [ ] Implementar AdminCatalogPage.jsx con formulario completo para crear productos
  - [ ] Campo categoría: dropdown con opciones existentes + opción para crear nueva
  - [ ] Campos cajas y ubicación
  - [ ] Otros campos del producto (nombre, color, etc.)
  - [ ] Funcionalidad de búsqueda/listado de productos
- [ ] Integrar con API para crear productos y obtener categorías

### Testing
- [ ] Probar creación de productos con categorías nuevas y existentes
- [ ] Verificar que cajas y ubicación se guarden correctamente
- [ ] Probar búsqueda y listado en AdminCatalogPage

### Adicional (mencionado por usuario)
- [ ] Revisar lógica de pagos a crédito: mostrar pendientes, proceder compra aunque falte pago, mostrar en inventario
