import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  itemsname: { type: String, required: true },
  itemsprice: { type: Number, required: true },
  itemsimage: { type: String, required: true },
  itemsimages: { type: [String], default: [] }, // ✅ บังคับให้ MongoDB ใส่ [] ถ้าไม่มีค่า
  itemsurlyoutube: { type: String, default: "" }, // ✅ บังคับให้ MongoDB ใส่ [] ถ้าไม่มีค่า
  itemsdesc: { type: String, required: true },
  itemstitle: { type: String, required: true },
  itemsfile: { type: String, required: true },
  itemsversion: { type: String, required: true },
});

const Item = mongoose.models.Item || mongoose.model("Item", itemSchema);

export default Item;
