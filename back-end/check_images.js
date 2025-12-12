import axios from 'axios';

async function checkProducts() {
    try {
        const response = await axios.get('http://localhost:5000/api/productos');
        const products = response.data;

        console.log('--- LISTING ALL PRODUCTS ---');
        products.forEach(p => {
            console.log(`[${p._id}] Name: "${p.nombre}", Image: "${p.image}", 3D: ${JSON.stringify(p.objeto3D)}`);
        });

    } catch (error) {
        console.error('Error fetching products:', error.message);
    }
}

checkProducts();
