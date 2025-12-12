
import axios from 'axios';

async function testDuplicate() {
    try {
        const response = await axios.post('http://localhost:5000/api/productos', {
            nombre: "silla", // Known duplicate
            color: "Test",
            categoria: "Test",
            codigo: "TEST-001",
            tipo: "Producto Terminado"
        });
        console.log('UNEXPECTED SUCCESS:', response.status);
    } catch (error) {
        if (error.response) {
            console.log('Expected Error Status:', error.response.status);
            console.log('Error Data:', error.response.data);
        } else {
            console.error('Request failed:', error.message);
        }
    }
}

testDuplicate();
