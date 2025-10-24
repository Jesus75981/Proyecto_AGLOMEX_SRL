# TODO: Integración de Ventas con Inventario y Clientes

## Tareas Pendientes

### 1. Modificar VentasPage.jsx
- [ ] Cargar productos desde API `/api/productos` en lugar de lista predefinida
- [ ] Agregar verificación de stock disponible antes de vender
- [ ] Cargar clientes desde API `/api/clientes`
- [ ] Agregar funcionalidad de búsqueda/creación de clientes
- [ ] Conectar registro de ventas con API `/api/ventas`
- [ ] Actualizar inventario automáticamente al registrar venta
- [ ] Agregar validaciones de stock en el frontend

### 2. Ajustes en Backend (si es necesario)
- [ ] Verificar que el modelo de venta use Cliente en lugar de User
- [ ] Asegurar que las rutas de clientes estén correctamente configuradas

### 3. Testing
- [ ] Probar carga de productos desde API
- [ ] Probar búsqueda y selección de clientes
- [ ] Probar validación de stock
- [ ] Probar registro de venta y actualización de inventario
- [ ] Probar manejo de errores (stock insuficiente, etc.)
