// models/Order.js
import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'pending', 'error'],
    default: 'pending',
  },
  transRef: String,
  slipUrl: String,
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
