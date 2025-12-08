import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const runVerification = async () => {
    try {
        // 1. Login
        console.log('🔑 Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'dueno',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('✅ Login successful');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Get Dependencies (Clients, Products)
        console.log('📦 Fetching dependencies...');
        const [clientesRes, productosRes] = await Promise.all([
            axios.get(`${API_URL}/clientes`, { headers }),
            axios.get(`${API_URL}/productos`, { headers })
        ]);

        if (clientesRes.data.length === 0 || productosRes.data.length === 0) {
            throw new Error('Need at least one client and one product to test logistics.');
        }

        const clienteId = clientesRes.data[0]._id;
        const productoId = productosRes.data[0]._id;

        // 3. Create Transportista (if needed, or fetch existing)
        console.log('🚚 Fetching/Creating Transportista...');
        let transportistaId;
        try {
            const transRes = await axios.get(`${API_URL}/transportistas/activos`, { headers });
            if (transRes.data.length > 0) {
                transportistaId = transRes.data[0]._id;
                console.log(`✅ Using existing Transportista: ${transRes.data[0].nombre}`);
            } else {
                // Create one
                const newTrans = {
                    nombre: "Transportes Test " + Math.floor(Math.random() * 1000),
                    contacto: "Juan Perez",
                    telefono: "70012345",
                    email: "test@transportes.com",
                    tipo: "Terrestre",
                    costoBase: 50,
                    tiempoEntrega: "24 horas"
                };
                const createTransRes = await axios.post(`${API_URL}/transportistas`, newTrans, { headers });
                transportistaId = createTransRes.data._id;
                console.log(`✅ Created new Transportista: ${createTransRes.data.nombre}`);
            }
        } catch (e) {
            console.log('⚠️ Could not fetch/create transportista, proceeding without it (might fail if required).');
        }

        // 4. Create Logistics Order
        console.log('📦 Creating Logistics Order...');
        const newOrder = {
            pedidoNumero: Math.floor(Math.random() * 10000),
            cliente: clienteId,
            productos: [
                { producto: productoId, cantidad: 1 }
            ],
            fechaEntrega: new Date(Date.now() + 86400000).toISOString(),
            direccionEnvio: {
                calle: "Calle Falsa 123",
                ciudad: "La Paz",
                departamento: "La Paz",
                pais: "Bolivia"
            },
            metodoEntrega: "Envio Domicilio",
            tipoMovimiento: "Envío a Cliente",
            costoAdicional: 50,
            transportista: transportistaId
        };

        const createRes = await axios.post(`${API_URL}/logistica`, newOrder, { headers });
        const orderId = createRes.data._id;
        console.log(`✅ Order created with ID: ${orderId}`);

        // 5. List Orders
        console.log('📋 Listing Orders...');
        const listRes = await axios.get(`${API_URL}/logistica`, { headers });
        const found = listRes.data.find(o => o._id === orderId);
        if (!found) throw new Error('Created order not found in list.');
        console.log('✅ Order found in list.');

        // 6. Update Status
        console.log('🔄 Updating Status...');
        const updateRes = await axios.patch(`${API_URL}/logistica/${orderId}`, {
            estado: 'en_proceso'
        }, { headers });

        if (updateRes.data.estado !== 'en_proceso') throw new Error('Status update failed.');
        console.log('✅ Status updated to en_proceso.');

        // 7. Delete Order
        console.log('🗑️ Deleting Order...');
        await axios.delete(`${API_URL}/logistica/${orderId}`, { headers });
        console.log('✅ Order deleted.');

        console.log('🎉 LOGISTICS MODULE VERIFIED!');

    } catch (error) {
        console.error('❌ Verification Failed:', error.response ? error.response.data : error.message);
    }
};

runVerification();
