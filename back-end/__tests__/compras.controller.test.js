import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Compra from '../models/compra.model.js';
import ProductoTienda from '../models/productoTienda.model.js';
import MateriaPrima from '../models/materiaPrima.model.js';
import Proveedor from '../models/proveedores.model.js';
import { registrarCompra, listarCompras } from '../controllers/compras.controller.js';

let mongoServer;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    app = express();
    app.use(express.json());

    // Mock routes for testing
    app.post('/compras', registrarCompra);
    app.get('/compras', listarCompras);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Compra.deleteMany({});
    await ProductoTienda.deleteMany({});
    await MateriaPrima.deleteMany({});
    await Proveedor.deleteMany({});
});

describe('Compras Controller', () => {
    let proveedor;

    beforeEach(async () => {
        proveedor = new Proveedor({
            nombre: 'Proveedor Test',
            contacto: { telefono: '123456789', email: 'test@proveedor.com' },
            nit: '123456789'
        });
        await proveedor.save();
    });

    describe('registrarCompra', () => {
        it('should register a purchase with product terminado successfully', async () => {
            const compraData = {
                numCompra: 'COMP-001',
                tipoCompra: 'Producto Terminado',
                proveedor: proveedor._id,
                productos: [{
                    nombreProducto: 'Silla Moderna',
                    colorProducto: 'Negro',
                    categoriaProducto: 'Silla',
                    cantidad: 10,
                    precioUnitario: 50,
                    dimensiones: { alto: 80, ancho: 40, profundidad: 40 },
                    imagenProducto: 'silla.jpg',
                    codigo: 'SIL-1234',
                    onModel: 'ProductoTienda'
                }],
                metodosPago: [{ tipo: 'Efectivo', monto: 500 }],
                totalCompra: 500
            };

            const response = await request(app)
                .post('/compras')
                .send(compraData);

            expect(response.status).toBe(201);
            expect(response.body.message).toContain('registrada');
            expect(response.body.compra.numCompra).toMatch(/^COMP-\d{8}-\d{4}$/);
        });

        it('should register a purchase with materia prima successfully', async () => {
            const compraData = {
                numCompra: 'COMP-002',
                tipoCompra: 'Materia Prima',
                proveedor: proveedor._id,
                productos: [{
                    nombreProducto: 'Madera Pino',
                    cantidad: 100,
                    precioUnitario: 5,
                    colorProducto: 'Natural',
                    categoriaProducto: 'Madera',
                    onModel: 'MateriaPrima'
                }],
                metodosPago: [{ tipo: 'Transferencia', monto: 500 }],
                totalCompra: 500
            };

            const response = await request(app)
                .post('/compras')
                .send(compraData);

            expect(response.status).toBe(201);
            expect(response.body.message).toContain('registrada');
        });

        it('should fail if payment total does not match purchase total', async () => {
            const compraData = {
                numCompra: 'COMP-003',
                tipoCompra: 'Producto Terminado',
                proveedor: proveedor._id,
                productos: [{
                    nombreProducto: 'Mesa',
                    colorProducto: 'Blanco',
                    categoriaProducto: 'Mesa',
                    cantidad: 1,
                    precioUnitario: 100,
                    onModel: 'ProductoTienda'
                }],
                metodosPago: [{ tipo: 'Efectivo', monto: 50 }],
                totalCompra: 100
            };

            const response = await request(app)
                .post('/compras')
                .send(compraData);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('La suma de los pagos');
        });

        it('should fail if no products are provided', async () => {
            const compraData = {
                numCompra: 'COMP-004',
                tipoCompra: 'Producto Terminado',
                proveedor: proveedor._id,
                productos: [],
                metodosPago: [{ tipo: 'Efectivo', monto: 0 }],
                totalCompra: 0
            };

            const response = await request(app)
                .post('/compras')
                .send(compraData);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('al menos un producto');
        });
    });

    describe('listarCompras', () => {
        it('should list purchases successfully', async () => {
            // Create a sample purchase
            const compra = new Compra({
                numCompra: 'COMP-005',
                tipoCompra: 'Producto Terminado',
                proveedor: proveedor._id,
                productos: [{
                    producto: new mongoose.Types.ObjectId(),
                    cantidad: 5,
                    precioUnitario: 20,
                    onModel: 'ProductoTienda'
                }],
                metodosPago: [{ tipo: 'Efectivo', monto: 100 }],
                totalCompra: 100
            });
            await compra.save();

            const response = await request(app)
                .get('/compras');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });
    });
});
