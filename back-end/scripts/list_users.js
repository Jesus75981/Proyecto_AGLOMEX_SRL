import mongoose from 'mongoose';
import User from '../models/user.model.js';

const MONGODB_URI = 'mongodb://localhost:27017/mueblesDB';

async function listUsers() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const users = await User.find({}, 'username email rol');
        console.log('Users found:');
        users.forEach(u => console.log(`- User: ${u.username}, Email: ${u.email}, Role: "${u.rol}"`));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

listUsers();
