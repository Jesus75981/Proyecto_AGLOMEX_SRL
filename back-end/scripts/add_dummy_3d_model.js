import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Objeto3D from '../models/objetos3d.model.js';
import ProductoTienda from '../models/productoTienda.model.js';

dotenv.config();

const MONGODB_URI = 'mongodb://localhost:27017/mueblesDB';

const dummyGlbUrl = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
const dummyUsdzUrl = 'https://modelviewer.dev/shared-assets/models/Astronaut.usdz';

const addDummyModel = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB');

        // 1. Buscar un producto existente para actualizar
        const producto = await ProductoTienda.findOne({ activo: true });

        if (!producto) {
            console.log('❌ No se encontró ningún producto activo para actualizar.');
            process.exit(1);
        }

        console.log(`📦 Producto encontrado: ${producto.nombre} (${producto._id})`);

        // 2. Crear un objeto 3D dummy
        const nuevoObjeto3D = new Objeto3D({
            producto: producto._id,
            sourceImage: 'https://placehold.co/400x400/png?text=Source+Image', // Dummy image
            prompt: 'Dummy 3D Model for Testing',
            status: 'done',
            glbUrl: dummyGlbUrl,
            usdzUrl: dummyUsdzUrl,
            tripoTaskId: 'dummy-task-id-' + Date.now()
        });

        await nuevoObjeto3D.save();
        console.log('✅ Objeto 3D dummy creado:', nuevoObjeto3D._id);

        // 3. Vincular al producto USANDO findByIdAndUpdate para evitar validaciones de otros campos
        await ProductoTienda.findByIdAndUpdate(producto._id, { objeto3D: nuevoObjeto3D._id });
        console.log('✅ Producto actualizado con referencia al objeto 3D');

        console.log('🎉 ¡Listo! Ahora el producto debería mostrar el botón de AR.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

addDummyModel();
