# TODO: Implementar Carrito de Ventas Similar a Compras

## Información Recopilada
- Analizado ComprasPage.jsx: Tiene carrito con array de productos, formulario de búsqueda, tabla de productos agregados, cálculo de total.
- VentasPage.jsx actual: Maneja solo un producto por venta, necesita conversión a carrito múltiple.

## Plan de Implementación
1. **Agregar Estados para Carrito**
   - Agregar `productoTemporal` para formulario temporal de producto
   - Agregar `busquedaProducto` para búsqueda de productos
   - Agregar `productosFiltrados` y `mostrarResultadosProducto` para dropdown

2. **Modificar Formulario de Nueva Venta**
   - Agregar sección de búsqueda y agregar productos (similar a compras)
   - Agregar tabla de productos agregados al carrito
   - Mostrar total calculado de todos los productos

3. **Funciones Nuevas**
   - `agregarProductoAVenta()`: Agregar producto al array `nuevaVenta.productos`
   - `quitarProductoDeVenta(index)`: Remover producto del carrito
   - Actualizar `calcularTotal()` para usar array de productos

4. **Actualizar Tabla de Historial**
   - Cambiar tabla para mostrar resumen de venta (ID, cliente, total, fecha, estado)
   - Agregar funcionalidad para expandir y ver detalles de productos

5. **Modificar `agregarVenta`**
   - Usar `nuevaVenta.productos` directamente
   - Validar que haya al menos un producto
   - Limpiar carrito después de registrar

6. **Limpiar Código Antiguo**
   - Remover lógica de un solo producto (producto, cantidad, precio individuales)
   - Actualizar validaciones

## Dependencias
- Archivo: front-end/src/assets/pages/VentasPage.jsx
- No se requieren cambios en backend (ya soporta array de productos)

## Seguimiento de Progreso
- [x] Agregar estados para carrito
- [x] Implementar formulario de búsqueda y agregar productos
- [x] Agregar tabla de productos en carrito
- [x] Actualizar cálculo de total
- [ ] Modificar tabla de historial (cambiar a vista resumen con expansión para detalles)
- [x] Actualizar función agregarVenta
- [x] Limpiar código antiguo
- [ ] Probar funcionalidad completa
