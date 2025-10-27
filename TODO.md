# TODO: Cambiar sistema de compras y ventas a Bolivianos (BOB)

## Información Recopilada
- El backend ya está configurado para usar 'BOB' con tasa de cambio 1 en los controladores de compras, ventas y anticipos.
- El frontend aún muestra símbolos $ en lugar de Bs. para Bolivianos.
- Las páginas afectadas incluyen ComprasPage, VentasPage, FinanzasPage, ReporteVentasDiario y InventarioPage.
- FinanzasPage usa formato de moneda MXN, necesita cambiarse a BOB.

## Plan de Actualización
1. **ComprasPage.jsx**: Reemplazar todos los símbolos $ con Bs. en textos de totales y precios.
2. **VentasPage.jsx**: Reemplazar todos los símbolos $ con Bs. en métricas, precios y totales.
3. **FinanzasPage.jsx**: Cambiar formatCurrency de 'MXN'/'es-MX' a 'BOB'/'es-BO'.
4. **ReporteVentasDiario.jsx**: Reemplazar $ con Bs. en el total de ventas.
5. **InventarioPage.jsx**: Reemplazar $ con Bs. en costos y valores totales.

## Archivos Dependientes
- front-end/src/assets/pages/ComprasPage.jsx
- front-end/src/assets/pages/VentasPage.jsx
- front-end/src/assets/pages/FinanzasPage.jsx
- front-end/src/assets/pages/ReporteVentasDiario.jsx
- front-end/src/assets/pages/InventarioPage.jsx

## Pasos de Seguimiento
- Ejecutar el frontend después de cambios para verificar que muestre Bs. en lugar de $.
- Probar módulos de compras y ventas para confirmar visualización correcta de monedas.
