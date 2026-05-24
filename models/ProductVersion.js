import mongoose from "mongoose";

const ProductVersionSchema = new mongoose.Schema({

    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },

    version: String,

    title: String,

    changelog: [String],

    downloadUrl: String,

    fileSize: String,

    hash: String,

    releaseType: {
        type: String,
        enum: ["major", "minor", "hotfix"],
        default: "minor"
    },

    isImportant: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

export default mongoose.models.ProductVersion ||
mongoose.model("ProductVersion", ProductVersionSchema);