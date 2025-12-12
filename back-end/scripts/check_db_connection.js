
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mueblesDB';

console.log('Testing connection to:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected! ReadyState:', mongoose.connection.readyState);
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection failed:', err);
        process.exit(1);
    });
