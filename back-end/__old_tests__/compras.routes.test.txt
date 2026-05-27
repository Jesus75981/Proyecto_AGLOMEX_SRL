import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import comprasRoutes from '../routes/compras.routes.js';
import Compra from '../models/compra.model.js';
import Proveedor from '../models/proveedores.model.js';

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    app = express();
    app.use(express.json());
    app.use('/api/compras', comprasRoutes);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Compra.deleteMany({});
    await Proveedor.deleteMany({});
});

describe('Compras Routes', () => {
    let proveedor;

    beforeEach(async () => {
        proveedor = new Proveedor({
            nombre: 'Proveedor Test',
            contacto: { telefono: '123456789', email: 'test@proveedor.com' },
            nit: '123456789'
        });
        await proveedor.save();
    });

    describe('POST /api/compras', () => {
        it('should register a purchase via route', async () => {
            const compraData = {
                numCompra: 'COMP-001',
                tipoCompra: 'Producto Terminado',
                proveedor: proveedor._id.toString(),
                productos: [{
                    nombreProducto: 'Silla Test',
                    colorProducto: 'Azul',
                    categoriaProducto: 'Silla',
                    cantidad: 5,
                    precioUnitario: 30,
                    dimensiones: { alto: 90, ancho: 45, profundidad: 45 },
                    codigo: 'SIL-5678'
                }],
                metodosPago: [{ tipo: 'Efectivo', monto: 150 }],
                totalCompra: 150
            };

            const response = await request(app)
                .post('/api/compras')
                .send(compraData);

            expect(response.status).toBe(201);
            expect(response.body.message).toContain('registrada');
            expect(response.body.compra.numCompra).toMatch(/^COMP-\d{8}-\d{4}$/);
        });

        it('should return 400 for invalid purchase data', async () => {
            const invalidData = {
                numCompra: 'COMP-002',
                tipoCompra: 'Producto Terminado',
                proveedor: proveedor._id.toString(),
                productos: [],
                metodosPago: [{ tipo: 'Efectivo', monto: 0 }],
                totalCompra: 0
            };

            const response = await request(app)
                .post('/api/compras')
                .send(invalidData);

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/compras', () => {
        it('should list purchases via route', async () => {
            // Create a sample purchase
            const compra = new Compra({
                numCompra: 'COMP-003',
                tipoCompra: 'Producto Terminado',
                proveedor: proveedor._id,
                productos: [{
                    producto: new mongoose.Types.ObjectId(),
                    cantidad: 2,
                    precioUnitario: 25,
                    onModel: 'ProductoTienda'
                }],
                metodosPago: [{ tipo: 'Transferencia', monto: 50 }],
                totalCompra: 50
            });
            await compra.save();

            const response = await request(app)
                .get('/api/compras');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
});
