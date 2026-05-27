import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true,
    trim: true,
  },
  description: { type: String, default: "" },
  discountType: { 
    type: String, 
    enum: ["percentage", "fixed"], 
    default: "percentage" 
  },
  discountValue: { type: Number, required: true },
  minPurchase: { type: Number, default: 0 },
  maxUsage: { type: Number, default: 0 },
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  
  // ✅ เพิ่ม: กำหนดสินค้าที่ใช้ได้
  productRestriction: {
    type: String,
    enum: ["all", "specific"], // all = ทุกสินค้า, specific = เฉพาะที่กำหนด
    default: "all",
  },
  allowedProductIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Item" 
  }], // ✅ รายการสินค้าที่ใช้ได้ (ถ้าเป็น specific)
  
  createdBy: { type: String, default: "Admin" },
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual: isValid
CouponSchema.virtual("isValid").get(function () {
  const now = new Date();
  if (this.isActive === false) return false;
  if (this.expiresAt && new Date(this.expiresAt) < now) return false;
  if (this.maxUsage > 0 && this.usedCount >= this.maxUsage) return false;
  return true;
});

// Method: checkValidity
CouponSchema.methods.checkValidity = function(totalPrice, productId) {
  const now = new Date();
  
  if (!this.isActive) {
    return { valid: false, error: "คูปองนี้ถูกปิดใช้งาน" };
  }
  
  if (this.expiresAt) {
    const expiryDate = new Date(this.expiresAt);
    if (expiryDate < now) {
      return { valid: false, error: "คูปองหมดอายุแล้ว" };
    }
  }
  
  if (this.maxUsage > 0 && this.usedCount >= this.maxUsage) {
    return { valid: false, error: "คูปองถูกใช้ครบจำนวนแล้ว" };
  }
  
  // ✅ เช็คข้อจำกัดสินค้า
  if (this.productRestriction === "specific" && productId) {
    const isAllowed = this.allowedProductIds.some(
      id => id.toString() === productId.toString()
    );
    if (!isAllowed) {
      return { valid: false, error: "คูปองนี้ใช้กับสินค้าที่กำหนดเท่านั้น" };
    }
  }
  
  if (totalPrice && totalPrice < this.minPurchase) {
    return { 
      valid: false, 
      error: `ต้องซื้อขั้นต่ำ ${this.minPurchase.toLocaleString()} Point` 
    };
  }
  
  let discount = 0;
  if (this.discountType === "percentage") {
    discount = Math.round((totalPrice * this.discountValue) / 100);
  } else {
    discount = this.discountValue;
  }
  
  const finalPrice = Math.max(0, totalPrice - discount);
  
  return {
    valid: true,
    coupon: {
      code: this.code,
      discountType: this.discountType,
      discountValue: this.discountValue,
      discount: discount,
      finalPrice: finalPrice,
    }
  };
};

export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);