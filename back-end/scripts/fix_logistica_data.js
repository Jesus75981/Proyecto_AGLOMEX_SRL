
import mongoose from 'mongoose';

// Configuración de conexión (Hardcoded para script temporal)
const MONGODB_URI = "mongodb://127.0.0.1:27017/proyecto_muebles";

const logisticaSchema = new mongoose.Schema({
    pedidoNumero: Number,
    cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' }, // Referencia, pero para este fix quizás sea string poblado? No, es ref.
    // Pero el frontend mostraba "Cliente Test". Si es una REF, necesitamos un Cliente llamado "Roberto"?
    // Espera, el frontend LogisticaPage.jsx hace: envio.cliente?.nombre.
    // Si cambio el cliente a "Roberto", necesito un documento Cliente con nombre "Roberto".
    // O puedo hacer trampa si el schema fuera flexible, pero es ref.

    // Revisando logistica.model.js: cliente: { type: ObjectId, ref: 'Cliente' }
    // Así que debo crear o buscar un cliente "Roberto".

    empresaEnvio: String,
    estado: String
}, { strict: false }); // Strict false para leer todo

// Modelo Cliente para crear a Roberto
const clienteSchema = new mongoose.Schema({
    nombre: String,
    email: String,
    telefono: String
}, { strict: false });

const Logistica = mongoose.model('Logistica', logisticaSchema);
const Cliente = mongoose.model('Cliente', clienteSchema);
const Contador = mongoose.model('Contador', new mongoose.Schema({ nombre: String, valor: Number }));


const updateShipment = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado a MongoDB');

        // 1. Encontrar el último envío creado (el "problema")
        const ultimoEnvio = await Logistica.findOne().sort({ _id: -1 });

        if (!ultimoEnvio) {
            console.log('No hay envíos para actualizar.');
            process.exit(0);
        }
        console.log(`Último envío encontrado: ${ultimoEnvio._id}, Pedido#: ${ultimoEnvio.pedidoNumero}`);

        // 2. Gestionar Cliente "Roberto"
        let roberto = await Cliente.findOne({ nombre: 'Roberto' });
        if (!roberto) {
            console.log('Creando cliente Roberto...');
            roberto = await Cliente.create({
                nombre: 'Roberto',
                email: 'roberto@example.com',
                telefono: '70000000'
            });
        }

        // 3. Calcular siguiente número correlativo válido (ignorando los muy grandes como 999999)
        // Buscamos el max numero menor a 900000 (umbral arbitrario para detectar "basura")
        // Si no hay, empezamos en 1.
        const maxEnvio = await Logistica.findOne({ pedidoNumero: { $lt: 900000 }, _id: { $ne: ultimoEnvio._id } }).sort({ pedidoNumero: -1 });
        let nextNum = (maxEnvio && maxEnvio.pedidoNumero) ? maxEnvio.pedidoNumero + 1 : 1;

        // Si el último envío YA tiene un número pequeño, podríamos dejarlo o forzarlo. 
        // Si el usuario se quejó de 999999, asumimos que tiene eso.
        // Si nextNum conflictua con ultimoEnvio.pedidoNumero (porque es el mismo), no hacemos nada?
        // Pero queremos forzar Roberto.

        console.log(`Asignando nuevo correlativo: ${nextNum} (Max anterior: ${maxEnvio ? maxEnvio.pedidoNumero : 'Ninguno'})`);

        // 4. Actualizar
        ultimoEnvio.cliente = roberto._id;
        ultimoEnvio.empresaEnvio = 'INDRIVE';

        // Solo cambiamos el número si es absurdo o si queremos reordenar.
        // El usuario dijo "codigo correlativo".
        ultimoEnvio.pedidoNumero = nextNum;

        try {
            await ultimoEnvio.save();
            console.log(`✅ Envío actualizado con éxito. Nuevo Tracking: ENV-${nextNum}`);

            // 5. Corregir Contador
            await Contador.findOneAndUpdate(
                { nombre: 'pedidoNumero' },
                { valor: nextNum },
                { upsert: true }
            );
            console.log(`✅ Contador ajustado a ${nextNum}`);

        } catch (e) {
            if (e.code === 11000) {
                console.log(`⚠️ Error duplicado: El número ${nextNum} ya existe. Intentando ${nextNum + 1}...`);
                ultimoEnvio.pedidoNumero = nextNum + 1;
                await ultimoEnvio.save();
                await Contador.findOneAndUpdate({ nombre: 'pedidoNumero' }, { valor: nextNum + 1 }, { upsert: true });
                console.log(`✅ Envío actualizado con Tracking: ENV-${nextNum + 1}`);
            } else {
                console.error(e);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

updateShipment();
