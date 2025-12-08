# TODO: Add Shopping Cart Functionality with WhatsApp Checkout and Update Prices to Bs

## Steps to Complete

1. **Update price display in ProductCard component**  
   - Change `${product.precioVenta.toFixed(2)}` to `Bs ${product.precioVenta.toFixed(2)}` in the inline ProductCard in CatalogPage.jsx.  
   - ✅ Completed: Updated to `Bs ${product.precioVenta.toFixed(2)}` in ProductCard component.

2. **Add cart state to CatalogPage.jsx**  
   - Import useState for cart (array of {product, quantity}).  
   - ✅ Completed: Added cart state and isCartOpen state.

3. **Modify ProductCard to include "Add to Cart" button**  
   - Add button in ProductCard that calls a function to add product to cart (increment if exists).  
   - ✅ Completed: Added "Agregar al Carrito" button with onAddToCart prop.

4. **Add cart icon/button in Navbar**  
   - Add a cart icon/button in Navbar to toggle cart modal, show cart item count.  
   - ✅ Completed: Added cart button with count badge and onCartClick prop.

5. **Create CartModal component**  
   - Create CartModal component within CatalogPage.jsx to display cart items, quantities, subtotals, total in Bs, remove items.  
   - ✅ Completed: Created CartModal with all required features.

6. **Implement WhatsApp checkout**  
   - Add "Checkout via WhatsApp" button in CartModal that generates WhatsApp URL with order details and opens it.  
   - ✅ Completed: Implemented handleWhatsAppCheckout function with proper message formatting.

7. **Test functionality**  
   - Run the app locally, test adding to cart, viewing cart, removing items, WhatsApp checkout.  
   - Ensure prices display correctly in Bs.
