import DeudaCompra from "../models/deudaCompra.model.js";
import DeudaVenta from "../models/deudaVenta.model.js";
import Compra from "../models/compra.model.js";
import Venta from "../models/venta.model.js";
import { registrarTransaccionFinanciera } from './finanzas.controller.js';

export const pagarDeuda = async (req, res) => {
    const { id } = req.params;
    const { monto, tipoPago, referencia, cuenta } = req.body;

    const montoFloat = parseFloat(monto);

    if (!montoFloat || !tipoPago) {
        return res.status(400).json({ message: "El monto (numérico) y el tipo de pago son obligatorios." });
    }

    if (montoFloat <= 0) {
        return res.status(400).json({ message: "El monto a pagar debe ser positivo." });
    }

    try {
        const deuda = await DeudaCompra.findById(id).populate('compraId');
        if (!deuda) {
            return res.status(404).json({ message: "Deuda no encontrada." });
        }

        if (montoFloat > deuda.saldoActual + 0.01) { // Adding small tolerance
            return res.status(400).json({ message: `El monto a pagar (${montoFloat}) no puede ser mayor al saldo actual (${deuda.saldoActual}).` });
        }

        // Registrar el pago en el historial
        const nuevoPago = {
            monto: montoFloat,
            tipoPago,
            referencia: referencia || `Pago a deuda de compra ${deuda.compraId.numCompra}`,
            cuenta: cuenta, // Guardar la cuenta seleccionada
            fechaPago: new Date()
        };
        deuda.historialPagos.push(nuevoPago);

        // Actualizar saldos y estado
        deuda.montoPagado += montoFloat;
        deuda.saldoActual -= montoFloat;

        if (deuda.saldoActual <= 0.01) {
            deuda.saldoActual = 0;
            deuda.estado = "Pagada";
        } else {
            deuda.estado = "Parcialmente Pagada";
        }

        const deudaActualizada = await deuda.save();

        // Actualizar también el estado y saldo en la compra original
        const compra = await Compra.findById(deuda.compraId._id);
        if (compra) {
            compra.saldoPendiente = deuda.saldoActual;
            compra.estado = deuda.estado;
            // Agregar el pago al historial de pagos de la compra
            compra.metodosPago.push({
                tipo: tipoPago,
                monto: montoFloat,
                referencia: referencia || `Pago de deuda`,
                cuenta: cuenta,
                fechaPago: new Date()
            });
            await compra.save();
        }

        // Registrar la transacción financiera como un egreso
        await registrarTransaccionFinanciera(
            'egreso',
            'pago_deuda_compra',
            `Pago de deuda para la compra #${deuda.compraId.numCompra}`,
            montoFloat,
            deuda.compraId._id,
            'Compra',
            {
                deudaId: deuda._id,
                numCompra: deuda.compraId.numCompra,
                tipoPago: tipoPago,
                cuenta: cuenta, // Incluir cuenta en metadata
                banco: cuenta // Alias for redundancy if needed
            }
        );

        res.status(200).json({
            message: "Pago registrado exitosamente.",
            deuda: deudaActualizada
        });

    } catch (error) {
        console.error("Error al pagar la deuda:", error);
        res.status(500).json({ message: "Error interno del servidor al procesar el pago.", error: error.message });
    }
};

export const listarDeudas = async (req, res) => {
    try {
        const deudas = await DeudaCompra.find({ estado: { $in: ["Pendiente", "Parcialmente Pagada"] } })
            .populate('proveedor', 'nombre')
            .populate('compraId', 'numCompra fecha totalCompra');
        res.status(200).json(deudas);
    } catch (error) {
        res.status(500).json({ message: "Error al listar las deudas.", error: error.message });
    }
};

// --- GESTIÓN DE DEUDAS DE VENTA (POR COBRAR) ---

export const listarDeudasVenta = async (req, res) => {
    try {
        const deudas = await DeudaVenta.find({ estado: { $in: ["Pendiente", "Parcialmente Pagada"] } })
            .populate('cliente', 'nombre')
            .populate('ventaId', 'numVenta fecha saldoPendiente'); // Adjust populated fields as needed
        res.status(200).json(deudas);
    } catch (error) {
        res.status(500).json({ message: "Error al listar cuentas por cobrar.", error: error.message });
    }
};

export const pagarDeudaVenta = async (req, res) => {
    const { id } = req.params;
    const { monto, tipoPago, referencia, cuenta } = req.body;

    const montoFloat = parseFloat(monto);

    if (!montoFloat || !tipoPago) {
        return res.status(400).json({ message: "El monto y el tipo de pago son obligatorios." });
    }

    try {
        const deuda = await DeudaVenta.findById(id).populate('ventaId');
        if (!deuda) {
            return res.status(404).json({ message: "Deuda no encontrada." });
        }

        if (montoFloat > deuda.saldoActual + 0.01) {
            return res.status(400).json({ message: `El monto a pagar (${montoFloat}) excede el saldo pendiente (${deuda.saldoActual}).` });
        }

        // Registrar el pago
        deuda.historialPagos.push({
            monto: montoFloat,
            tipoPago,
            referencia: referencia || `Cobro de venta ${deuda.ventaId.numVenta}`,
            cuenta: cuenta,
            fechaPago: new Date()
        });

        deuda.montoPagado = (deuda.montoPagado || 0) + montoFloat;
        deuda.saldoActual -= montoFloat;

        if (deuda.saldoActual <= 0.01) {
            deuda.saldoActual = 0;
            deuda.estado = "Pagada";
        } else {
            deuda.estado = "Parcialmente Pagada";
        }

        await deuda.save();

        // Actualizar Venta Original
        const venta = await Venta.findById(deuda.ventaId._id);
        if (venta) {
            venta.saldoPendiente = deuda.saldoActual;
            venta.estado = deuda.estado === "Pagada" ? "Pagada" : "Pendiente";
            venta.metodosPago.push({
                tipo: tipoPago,
                monto: montoFloat,
                cuenta: cuenta,
                fechaPago: new Date()
            });
            await venta.save();
        }

        // Registrar Ingreso Financiero
        await registrarTransaccionFinanciera(
            'ingreso',
            'cobro_venta',
            `Cobro de deuda por venta #${venta.numVenta}`,
            montoFloat,
            venta._id,
            'Venta',
            { tipoPago, deudaId: deuda._id, cuenta: cuenta, banco: cuenta }
        );

        res.status(200).json({ message: "Cobro registrado exitosamente.", deuda });

    } catch (error) {
        console.error("Error al registrar cobro:", error);
        res.status(500).json({ message: "Error al procesar el cobro.", error: error.message });
    }
};
