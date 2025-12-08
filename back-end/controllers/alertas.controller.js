import ProductoTienda from "../models/productoTienda.model.js";

// Función para obtener alertas de stock bajo
export const obtenerAlertasStock = async (req, res) => {
    try {
        // Buscar productos con stock bajo (menos de 6 unidades)
        const productosStockBajo = await ProductoTienda.find({
            cantidad: { $lt: 6, $gte: 0 } // Menos de 6 unidades pero mayor o igual a 0
        }).select('nombre idProductoTienda cantidad precioCompra precioVenta categoria');

        // Buscar productos agotados (0 unidades)
        const productosAgotados = await ProductoTienda.find({
            cantidad: 0
        }).select('nombre idProductoTienda cantidad precioCompra precioVenta categoria');

        // Crear alertas estructuradas
        const alertas = [];

        productosStockBajo.forEach(producto => {
            alertas.push({
                tipo: 'stock_bajo',
                severidad: 'medio',
                producto: producto.nombre,
                sku: producto.idProductoTienda,
                stockActual: producto.cantidad,
                categoria: producto.categoria,
                mensaje: `Stock bajo: ${producto.cantidad} unidades restantes`,
                recomendacion: 'Considerar reabastecimiento urgente',
                fechaAlerta: new Date()
            });
        });

        productosAgotados.forEach(producto => {
            alertas.push({
                tipo: 'agotado',
                severidad: 'alto',
                producto: producto.nombre,
                sku: producto.idProductoTienda,
                stockActual: producto.cantidad,
                categoria: producto.categoria,
                mensaje: `Producto agotado: ${producto.nombre}`,
                recomendacion: 'Reabastecimiento inmediato requerido',
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
            alertasStockBajo: productosStockBajo.length,
            alertasAgotados: productosAgotados.length,
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

        const metricas = {
            totalProductos: productos.length,
            productosDisponibles: productos.filter(p => p.cantidad > 5).length,
            productosStockBajo: productos.filter(p => p.cantidad > 0 && p.cantidad <= 5).length,
            productosAgotados: productos.filter(p => p.cantidad === 0).length,
            valorTotalInventario: productos.reduce((sum, p) => sum + (p.cantidad * p.precioCompra), 0),
            productosSinPrecioCompra: productos.filter(p => !p.precioCompra || p.precioCompra === 0).length,
            productosSinPrecioVenta: productos.filter(p => !p.precioVenta || p.precioVenta === 0).length
        };

        // Agregación: Valor y Stock por Categoría
        const metricasPorCategoria = await ProductoTienda.aggregate([
            {
                $group: {
                    _id: "$categoria",
                    totalStock: { $sum: "$cantidad" },
                    valorTotal: { $sum: { $multiply: ["$cantidad", "$precioCompra"] } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { valorTotal: -1 } }
        ]);

        // Top 5 Productos con mayor stock
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
