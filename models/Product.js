import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
    name: String,
    slug: String,
    description: String,
    image: String,
    price: Number,

    currentVersion: {
        type: String,
        default: "1.0.0"
    },

    latestUpdate: {
        type: Date,
        default: Date.now
    },

    forceUpdate: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

export default mongoose.models.Product ||
mongoose.model("Product", ProductSchema);