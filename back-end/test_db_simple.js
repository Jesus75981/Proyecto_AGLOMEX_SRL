
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

console.log('Connecting...');
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected!');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
