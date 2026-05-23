import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema({
    userId: String,
    amount: Number,
    refNumber: String,
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
