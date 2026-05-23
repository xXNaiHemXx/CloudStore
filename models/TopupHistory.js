// models/TopupHistory.js
import mongoose from "mongoose";

const TopupHistorySchema = new mongoose.Schema({
  userId: String,
  amount: Number,
  status: {
    type: String,
    enum: ["success", "pending", "error", "duplicate"],
    default: "pending",
  },
  transRef: String,
  slipUrl: String,
}, { timestamps: true });

export default mongoose.models.TopupHistory || mongoose.model("TopupHistory", TopupHistorySchema);
