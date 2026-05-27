import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
  discordId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { type: String, default: "Unknown" },
  role: { 
    type: String, 
    enum: ["head", "admin", "moderator"], 
    default: "admin" 
  },
  addedBy: { type: String, default: "System" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Admin || mongoose.model("Admin", AdminSchema);