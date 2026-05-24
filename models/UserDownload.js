import mongoose from "mongoose";

const UserDownloadSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  version: { type: String, required: true },
  downloadedAt: { type: Date, default: Date.now },
  ip: { type: String }
});

export default mongoose.models.UserDownload || mongoose.model("UserDownload", UserDownloadSchema);