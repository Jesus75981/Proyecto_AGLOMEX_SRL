// controllers/compras.controller.js
import Compra from "../models/compra.model.js";

// ✅ VERIFICAR SI EL ARCHIVO EXISTE
let ProductoTienda;
try {
    ProductoTienda = (await import("../models/productoTienda.model.js")).default;
    console.log('✅ Modelo ProductoTienda cargado correctamente');
} catch (importError) {
    console.error('❌ Error cargando ProductoTienda:', importError.message);
    // Fallback temporal
    ProductoTienda = null;
}

export const registrarCompra = async (req, res) => {
    const datosCompra = req.body; 

    try {
        console.log('📦 Datos recibidos para compra:', datosCompra);
        
        if (!datosCompra.productos || datosCompra.productos.length === 0) {
            return res.status(400).json({ message: "La compra debe contener al menos un producto." });
        }

        // ✅ VERIFICAR SI PRODUCTOTIENDA ESTÁ DISPONIBLE
        if (!ProductoTienda) {
            console.log('⚠️ ProductoTienda no disponible, guardando solo compra');
            
            // Guardar solo la compra sin actualizar inventario
            const nuevaCompra = new Compra(datosCompra);
            const compraGuardada = await nuevaCompra.save();
            
            return res.status(201).json({ 
                message: `✅ Compra #${compraGuardada.numCompra} registrada (inventario no actualizado)`,
                compra: compraGuardada,
                nota: "El modelo ProductoTienda no está disponible"
            });
        }

        // ✅ VALIDAR QUE LOS PRODUCTOS EXISTAN
        const productosIds = datosCompra.productos.map(p => p.producto);
        const productosExistentes = await ProductoTienda.find({ 
            _id: { $in: productosIds } 
        });
        
        if (productosExistentes.length !== datosCompra.productos.length) {
            return res.status(400).json({ 
                message: "Algunos productos no existen en la base de datos" 
            });
        }

        // ✅ GENERAR NÚMERO DE COMPRA AUTOMÁTICO
        if (!datosCompra.numCompra) {
            const ultimaCompra = await Compra.findOne().sort({ numCompra: -1 });
            datosCompra.numCompra = ultimaCompra ? ultimaCompra.numCompra + 1 : 1;
        }

        // ✅ CALCULAR PRECIO TOTAL SI NO VIENE
        datosCompra.productos = datosCompra.productos.map(producto => ({
            ...producto,
            precioTotal: producto.precioTotal || (producto.cantidad * producto.precioUnitario)
        }));

        // 1. GUARDAR COMPRA
        const nuevaCompra = new Compra(datosCompra);
        const compraGuardada = await nuevaCompra.save();
        console.log('✅ Compra guardada ID:', compraGuardada._id);

        // 2. ACTUALIZAR INVENTARIO
        const updatePromises = datosCompra.productos.map(item => {
            console.log('🔄 Actualizando stock producto:', item.producto, '+', item.cantidad);
            
            const updateFields = { 
                $inc: { 
                    cantidad: item.cantidad
                } 
            };
            
            if (item.codigoProveedor) {
                updateFields.$set = { codigoProveedor: item.codigoProveedor };
            }

            return ProductoTienda.findByIdAndUpdate(
                item.producto,
                updateFields,
                { new: true } 
            );
        });

        const inventarioActualizado = await Promise.all(updatePromises);
        console.log('✅ Inventario actualizado:', inventarioActualizado.length, 'productos');
        
        res.status(201).json({ 
            message: `✅ Compra #${compraGuardada.numCompra} registrada exitosamente!`,
            compra: compraGuardada,
            inventarioAfectado: inventarioActualizado
        });

    } catch (error) {
        console.error("❌ Error completo en compra:", error);
        res.status(500).json({ 
            message: "Error interno del servidor",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const listarCompras = async (req, res) => {
    try {
        const historial = await Compra.find()
            .populate('productos.producto', 'nombre precioVenta cantidad')
            .populate('proveedor', 'nombre contacto')
            .limit(50)
            .sort({ fecha: -1 });
        res.status(200).json(historial);
    } catch (error) {
        res.status(500).json({ message: "Error al listar compras", error: error.message });
    }
};