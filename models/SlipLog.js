// models/SlipLog.js
import mongoose from "mongoose";

const SlipLogSchema = new mongoose.Schema({
  transRef: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.SlipLog || mongoose.model("SlipLog", SlipLogSchema);
