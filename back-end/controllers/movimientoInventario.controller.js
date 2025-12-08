import MovimientoInventario from "../models/movimientoInventario.model.js";
import ProductoTienda from "../models/productoTienda.model.js";

// Crear un nuevo movimiento de inventario
export const crearMovimiento = async (req, res) => {
    try {
        const { productoId, tipo, cantidad, motivo, referencia, usuario } = req.body;

        // 1. Validar datos
        if (!productoId || !tipo || !cantidad || !motivo) {
            return res.status(400).json({ message: "Faltan datos obligatorios (productoId, tipo, cantidad, motivo)" });
        }

        const cantidadNum = parseInt(cantidad);
        if (isNaN(cantidadNum) || cantidadNum <= 0) {
            return res.status(400).json({ message: "La cantidad debe ser un número positivo" });
        }

        // 2. Buscar producto
        const producto = await ProductoTienda.findById(productoId);
        if (!producto) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        const stockAnterior = producto.cantidad;
        let stockActual = stockAnterior;

        // 3. Calcular nuevo stock
        if (tipo === 'Entrada') {
            stockActual = stockAnterior + cantidadNum;
        } else if (tipo === 'Salida') {
            if (stockAnterior < cantidadNum) {
                return res.status(400).json({ message: `Stock insuficiente. Disponible: ${stockAnterior}` });
            }
            stockActual = stockAnterior - cantidadNum;
        } else if (tipo === 'Ajuste') {
            // Ajuste directo al valor especificado (asumiendo que 'cantidad' es el nuevo stock, o la diferencia?)
            // Generalmente 'Ajuste' puede ser positivo o negativo, pero aquí simplificamos:
            // Si es ajuste, asumimos que 'cantidad' es la cantidad a AJUSTAR (sumar o restar? o valor final?)
            // Para consistencia con el frontend que envía "cantidad", vamos a asumir que es una corrección.
            // Pero el frontend actual calcula stockActual = cantidad (si es ajuste).
            // Vamos a seguir la lógica del frontend: si es ajuste, la cantidad enviada ES el nuevo stock?
            // Revisando InventarioPage.jsx: "stockActual = parseInt(nuevoMovimiento.cantidad);"
            stockActual = cantidadNum;
        } else {
            return res.status(400).json({ message: "Tipo de movimiento inválido" });
        }

        // 4. Actualizar producto
        producto.cantidad = stockActual;
        await producto.save();

        // 5. Registrar movimiento
        const nuevoMovimiento = new MovimientoInventario({
            producto: producto._id,
            tipo,
            cantidad: cantidadNum, // Para ajuste, esto podría ser confuso, pero guardamos el valor ingresado
            motivo,
            referencia,
            usuario,
            stockAnterior,
            stockActual
        });

        await nuevoMovimiento.save();

        // 6. Responder
        const movimientoPoblado = await MovimientoInventario.findById(nuevoMovimiento._id).populate('producto', 'nombre idProductoTienda');

        res.status(201).json({
            message: "Movimiento registrado exitosamente",
            movimiento: movimientoPoblado,
            nuevoStock: stockActual
        });

    } catch (error) {
        console.error('Error creando movimiento:', error);
        res.status(500).json({ error: error.message });
    }
};

// Listar movimientos
export const listarMovimientos = async (req, res) => {
    try {
        const movimientos = await MovimientoInventario.find()
            .populate('producto', 'nombre idProductoTienda')
            .sort({ fecha: -1 })
            .limit(100); // Limitar a los últimos 100 para no sobrecargar
        res.json(movimientos);
    } catch (error) {
        console.error('Error listando movimientos:', error);
        res.status(500).json({ error: error.message });
    }
};
