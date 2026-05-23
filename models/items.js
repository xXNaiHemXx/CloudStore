import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  itemsname: { type: String, required: true },
  itemsprice: { type: Number, required: true },
  itemsimage: { type: String, required: true },
  itemsimages: { type: [String], default: [] },
  itemsurlyoutube: { type: String, default: "" },
  itemsdesc: { type: String, required: true },
  itemstitle: { type: String, required: true },
  itemsfile: { type: String, required: true },
  itemsversion: { type: String, required: true },
  discordRoleIds: { type: [String], default: [] }, // ✅ ต้องเป็น Array
});

const Item = mongoose.models.Item || mongoose.model("Item", itemSchema);

export default Item;