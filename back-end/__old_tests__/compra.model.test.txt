import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Compra from '../models/compra.model.js';
import Proveedor from '../models/proveedores.model.js';

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Compra.deleteMany({});
    await Proveedor.deleteMany({});
});

describe('Compra Model', () => {
    let proveedor;

    beforeEach(async () => {
        proveedor = new Proveedor({
            nombre: 'Proveedor Test',
            contacto: { telefono: '123456789', email: 'test@proveedor.com' },
            nit: '123456789'
        });
        await proveedor.save();
    });

    it('should create a valid compra', async () => {
        const compraData = {
            numCompra: 'COMP-001',
            tipoCompra: 'Producto Terminado',
            proveedor: proveedor._id,
            productos: [{
                producto: new mongoose.Types.ObjectId(),
                cantidad: 10,
                precioUnitario: 50
            }],
            metodosPago: [{ tipo: 'Efectivo', monto: 500 }],
            totalCompra: 500
        };

        const compra = new Compra(compraData);
        const savedCompra = await compra.save();

        expect(savedCompra.numCompra).toBe('COMP-001');
        expect(savedCompra.tipoCompra).toBe('Producto Terminado');
        expect(savedCompra.estado).toBe('Pagada');
    });

    it('should fail if numCompra is not unique', async () => {
        const compraData1 = {
            numCompra: 'COMP-002',
            tipoCompra: 'Producto Terminado',
            proveedor: proveedor._id,
            productos: [{
                producto: new mongoose.Types.ObjectId(),
                cantidad: 5,
                precioUnitario: 20
            }],
            metodosPago: [{ tipo: 'Efectivo', monto: 100 }],
            totalCompra: 100
        };

        const compraData2 = { ...compraData1, numCompra: 'COMP-002' };

        await new Compra(compraData1).save();

        await expect(new Compra(compraData2).save()).rejects.toThrow();
    });

    it('should fail if tipoCompra is invalid', async () => {
        const compraData = {
            numCompra: 'COMP-003',
            tipoCompra: 'Tipo Invalido',
            proveedor: proveedor._id,
            productos: [{
                producto: new mongoose.Types.ObjectId(),
                cantidad: 1,
                precioUnitario: 10
            }],
            metodosPago: [{ tipo: 'Efectivo', monto: 10 }],
            totalCompra: 10
        };

        await expect(new Compra(compraData).save()).rejects.toThrow();
    });

    it('should fail if metodosPago is empty', async () => {
        const compraData = {
            numCompra: 'COMP-004',
            tipoCompra: 'Producto Terminado',
            proveedor: proveedor._id,
            productos: [{
                producto: new mongoose.Types.ObjectId(),
                cantidad: 1,
                precioUnitario: 10
            }],
            metodosPago: [],
            totalCompra: 10
        };

        await expect(new Compra(compraData).save()).rejects.toThrow();
    });

    it('should fail if pago tipo is invalid', async () => {
        const compraData = {
            numCompra: 'COMP-005',
            tipoCompra: 'Producto Terminado',
            proveedor: proveedor._id,
            productos: [{
                producto: new mongoose.Types.ObjectId(),
                cantidad: 1,
                precioUnitario: 10
            }],
            metodosPago: [{ tipo: 'Pago Invalido', monto: 10 }],
            totalCompra: 10
        };

        await expect(new Compra(compraData).save()).rejects.toThrow();
    });

    it('should fail if pago monto is negative', async () => {
        const compraData = {
            numCompra: 'COMP-006',
            tipoCompra: 'Producto Terminado',
            proveedor: proveedor._id,
            productos: [{
                producto: new mongoose.Types.ObjectId(),
                cantidad: 1,
                precioUnitario: 10
            }],
            metodosPago: [{ tipo: 'Efectivo', monto: -10 }],
            totalCompra: 10
        };

        await expect(new Compra(compraData).save()).rejects.toThrow();
    });
});
