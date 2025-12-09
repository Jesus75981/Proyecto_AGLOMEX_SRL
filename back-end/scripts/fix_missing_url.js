import mongoose from 'mongoose';
import Objeto3D from '../models/objetos3d.model.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = 'mongodb://localhost:27017/mueblesDB';
const OBJETO_ID = '693429a387b99dea96f04fe6'; // ID from product_status.json
const GLB_URL = "https://tripo-data.rg1.data.tripo3d.com/tcli_9a345065b0034139abc6f5f375c00449/20251206/1011964d-568d-4fc3-8de9-7192366ded43/tripo_pbr_model_1011964d-568d-4fc3-8de9-7192366ded43.glb?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly90cmlwby1kYXRhLnJnMS5kYXRhLnRyaXBvM2QuY29tL3RjbGlfOWEzNDUwNjViMDAzNDEzOWFiYzZmNWYzNzVjMDA0NDkvMjAyNTEyMDYvMTAxMTk2NGQtNTY4ZC00ZmMzLThkZTktNzE5MjM2NmRlZDQzL3RyaXBvX3Bicl9tb2RlbF8xMDExOTY0ZC01NjhkLTRmYzMtOGRlOS03MTkyMzY2ZGVkNDMuZ2xiIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzY1MDY1NjAwfX19XX0_&Signature=uBC6na38As6SykcFw1kP~Y3gqiSVdu~BK2EyHo~00kE5~Qt3dt9HyPWpSm9JKwUuB6ra0W3vn4o3cQ3WP3M6ELTBPSuHvl7fMS-2RxaNajMa54tW2ncorcsWw2kHIKcS4ps8tp4uo5fb3XzoXhFMoOXp-p7QVTqYCmNMRO2Z6AM5nqbzPZ~Z73MOdBIDx2Rs61t2AZcFHsejQLvQ0s7saUVH0Ot073tSbxVE8QnA2VV3xydUreYxQTafy91vlaiN42K6oAdrYJ0hjw9pcEfDqMaGi0n6Uxit6KS5PfbtxxZnAW6lKA9ceJ8-DaRNztbUyBokZuJAsC3-P6CAUXY-4w__&Key-Pair-Id=K1676C64NMVM2J";

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const result = await Objeto3D.findByIdAndUpdate(
            OBJETO_ID,
            { glbUrl: GLB_URL, status: 'done' },
            { new: true }
        );

        if (result) {
            console.log('Objeto3D updated successfully:');
            console.log(`- ID: ${result._id}`);
            console.log(`- GLB URL: ${result.glbUrl}`);
        } else {
            console.log('Objeto3D not found.');
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.connection.close();
    }
};

run();
