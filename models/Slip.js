// models/Slip.js
import mongoose from "mongoose";

const SlipSchema = new mongoose.Schema({
  ref_code: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  usedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Slip || mongoose.model("Slip", SlipSchema);
