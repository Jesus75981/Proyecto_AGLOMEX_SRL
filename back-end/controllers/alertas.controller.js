import ProductoTienda from "../models/productoTienda.model.js";
import MateriaPrima from "../models/materiaPrima.model.js";

// Función para obtener alertas de stock bajo
export const obtenerAlertasStock = async (req, res) => {
    try {
        // --- PRODUCTOS ---
        const productosStockBajo = await ProductoTienda.find({
            cantidad: { $lt: 6, $gte: 0 }
        }).select('nombre idProductoTienda cantidad precioCompra precioVenta categoria');

        const productosAgotados = await ProductoTienda.find({
            cantidad: 0
        }).select('nombre idProductoTienda cantidad precioCompra precioVenta categoria');

        // --- MATERIA PRIMA ---
        const materiaPrimaStockBajo = await MateriaPrima.find({
            cantidad: { $lt: 10, $gte: 0 } // Umbral diferente para MP (ej. 10)
        }).select('nombre idMateriaPrima cantidad precioCompra categoria');

        const materiaPrimaAgotada = await MateriaPrima.find({
            cantidad: 0
        }).select('nombre idMateriaPrima cantidad precioCompra categoria');


        // Crear alertas estructuradas
        const alertas = [];

        // Procesar Productos
        productosStockBajo.forEach(producto => {
            alertas.push({
                tipo: 'stock_bajo',
                severidad: 'medio',
                origen: 'producto',
                producto: producto.nombre,
                sku: producto.idProductoTienda,
                stockActual: producto.cantidad,
                categoria: producto.categoria,
                mensaje: `Producto bajo en stock: ${producto.cantidad} un.`,
                recomendacion: 'Considerar reabastecimiento',
                fechaAlerta: new Date()
            });
        });

        productosAgotados.forEach(producto => {
            alertas.push({
                tipo: 'agotado',
                severidad: 'alto',
                origen: 'producto',
                producto: producto.nombre,
                sku: producto.idProductoTienda,
                stockActual: producto.cantidad,
                categoria: producto.categoria,
                mensaje: `Producto agotado: ${producto.nombre}`,
                recomendacion: 'Reabastecimiento inmediato',
                fechaAlerta: new Date()
            });
        });

        // Procesar Materia Prima
        materiaPrimaStockBajo.forEach(mp => {
            alertas.push({
                tipo: 'stock_bajo',
                severidad: 'medio',
                origen: 'materia_prima',
                producto: mp.nombre,
                sku: mp.idMateriaPrima || 'MP-N/A',
                stockActual: mp.cantidad,
                categoria: mp.categoria || 'Materia Prima',
                mensaje: `Material bajo: ${mp.cantidad} un.`,
                recomendacion: 'Solicitar a proveedor',
                fechaAlerta: new Date()
            });
        });

        materiaPrimaAgotada.forEach(mp => {
            alertas.push({
                tipo: 'agotado',
                severidad: 'alto',
                origen: 'materia_prima',
                producto: mp.nombre,
                sku: mp.idMateriaPrima || 'MP-N/A',
                stockActual: mp.cantidad,
                categoria: mp.categoria || 'Materia Prima',
                mensaje: `Material agotado: ${mp.nombre}`,
                recomendacion: 'Urgentemente contactar proveedor',
                fechaAlerta: new Date()
            });
        });

        // Ordenar por severidad (agotados primero)
        alertas.sort((a, b) => {
            const severidadOrder = { 'alto': 3, 'medio': 2, 'bajo': 1 };
            return severidadOrder[b.severidad] - severidadOrder[a.severidad];
        });

        res.status(200).json({
            totalAlertas: alertas.length,
            alertasStockBajo: productosStockBajo.length + materiaPrimaStockBajo.length,
            alertasAgotados: productosAgotados.length + materiaPrimaAgotada.length,
            alertas: alertas
        });

    } catch (error) {
        console.error('Error al obtener alertas de stock:', error);
        res.status(500).json({
            message: 'Error al obtener alertas de stock',
            error: error.message
        });
    }
};

// Función para obtener métricas generales del inventario
export const obtenerMetricasInventario = async (req, res) => {
    try {
        const productos = await ProductoTienda.find({});
        const materiasPrimas = await MateriaPrima.find({});

        // Métricas de Productos
        const totalProductos = productos.length;
        const valorProductos = productos.reduce((sum, p) => sum + (p.cantidad * p.precioCompra), 0);
        const prodStockBajo = productos.filter(p => p.cantidad > 0 && p.cantidad <= 5).length;
        const prodAgotados = productos.filter(p => p.cantidad === 0).length;

        // Métricas de Materia Prima
        const totalMateriales = materiasPrimas.length;
        const valorMateriales = materiasPrimas.reduce((sum, m) => sum + (m.cantidad * m.precioCompra), 0);
        const matStockBajo = materiasPrimas.filter(m => m.cantidad > 0 && m.cantidad <= 10).length;
        const matAgotados = materiasPrimas.filter(m => m.cantidad === 0).length;

        const metricas = {
            totalProductos: totalProductos + totalMateriales, // Total ítems en inventario
            totalItemsAcabados: totalProductos,
            totalItemsMateriaPrima: totalMateriales,

            productosDisponibles: productos.filter(p => p.cantidad > 5).length + materiasPrimas.filter(m => m.cantidad > 10).length,

            productosStockBajo: prodStockBajo + matStockBajo,
            productosAgotados: prodAgotados + matAgotados,

            valorTotalInventario: valorProductos + valorMateriales,
            valorMateriaPrima: valorMateriales,
            valorProductoTerminado: valorProductos,

            productosSinPrecioCompra: productos.filter(p => !p.precioCompra).length,
            productosSinPrecioVenta: productos.filter(p => !p.precioVenta).length
        };

        // Agregación: Valor y Stock por Categoría (Combinado)
        // 1. Productos
        const catProductos = await ProductoTienda.aggregate([
            {
                $group: {
                    _id: "$categoria",
                    totalStock: { $sum: "$cantidad" },
                    valorTotal: { $sum: { $multiply: ["$cantidad", "$precioCompra"] } },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 2. Materia Prima
        const catMateriales = await MateriaPrima.aggregate([
            {
                $group: {
                    _id: "$categoria",
                    totalStock: { $sum: "$cantidad" },
                    valorTotal: { $sum: { $multiply: ["$cantidad", "$precioCompra"] } },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Merge Categories
        const categoryMap = new Map();

        [...catProductos, ...catMateriales].forEach(cat => {
            const catName = cat._id || 'Sin Categoría';
            if (categoryMap.has(catName)) {
                const existing = categoryMap.get(catName);
                existing.totalStock += cat.totalStock;
                existing.valorTotal += cat.valorTotal;
                existing.count += cat.count;
            } else {
                categoryMap.set(catName, {
                    _id: catName,
                    totalStock: cat.totalStock,
                    valorTotal: cat.valorTotal,
                    count: cat.count
                });
            }
        });

        const metricasPorCategoria = Array.from(categoryMap.values()).sort((a, b) => b.valorTotal - a.valorTotal);

        // Top Productos (Solo Finished Goods for "Top Products" list usually, or mix?)
        // Let's keep Top *Products* as sold items (finished goods) are usually what executives care about for sales potential.
        // But for "Highest Stock", maybe both? Let's stick to ProductosTienda for "Top Stock" to match Dashboard usually showing products.
        const topProductosStock = await ProductoTienda.find()
            .sort({ cantidad: -1 })
            .limit(5)
            .select('nombre cantidad categoria');

        res.status(200).json({
            ...metricas,
            metricasPorCategoria,
            topProductosStock
        });

    } catch (error) {
        console.error('Error al obtener métricas del inventario:', error);
        res.status(500).json({
            message: 'Error al obtener métricas del inventario',
            error: error.message
        });
    }
};
