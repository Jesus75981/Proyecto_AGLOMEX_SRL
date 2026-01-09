import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const itemToDelete = "Silla semiejecutiva";

// Simple Schema for Deletion
const materiaPrimaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
});

// Explicitly use 'materiasprimas' collection as confirmed in other files or standard behavior
// If the model name is 'MateriaPrima', Mongoose defaults to 'materiaprimas' (plural lowercase).
// Let's force it to 'materiasprimas' if that's what is used, or just rely on 'MateriaPrima'.
// From model file: export default mongoose.model("MateriaPrima", materiaPrimaSchema); -> usually 'materiaprimas'.
// But let's check what the user has.
// To be safe, I'll use the model name 'MateriaPrima' which should map to the same collection.

const MateriaPrima = mongoose.model('MateriaPrima', materiaPrimaSchema);

const deleteItem = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in .env");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const result = await MateriaPrima.deleteMany({ nombre: itemToDelete });
        console.log(`Deleted ${result.deletedCount} items with name "${itemToDelete}".`);

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

deleteItem();
