// pages/api/topup/add-points.js
import dbConnect from "@/utils/db";
import User from '../../../models/User';
import Topup from '../../../models/Topup';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId, userName, amount, voucherCode, provider } = req.body;

  // Validation
  if (!userId || !amount) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    await dbConnect();

    // ค้นหาผู้ใช้
    let user = await User.findOne({ discordId: userId });
    
    // ถ้าไม่พบผู้ใช้ ให้สร้างใหม่ (กรณีเผื่อไว้)
    if (!user) {
      user = new User({
        discordId: userId,
        name: userName || 'Unknown User',
        points: 0
      });
      await user.save();
    }

    const pointsToAdd = parseInt(amount); // 1 บาท = 1 พ้อยท์
    const oldPoints = user.points || 0;
    const newPoints = oldPoints + pointsToAdd;

    // อัปเดตแต้มผู้ใช้
    user.points = newPoints;
    await user.save();

    // ตรวจสอบว่ามีการเติมเงินด้วยรหัสนี้ไปแล้วหรือยัง (ป้องกันการเติมซ้ำ)
    const existingTopup = await Topup.findOne({ 
      voucherCode: voucherCode,
      method: 'wallet'
    });
    
    if (existingTopup && existingTopup.status === 'success') {
      return res.status(400).json({
        success: false,
        message: 'รหัสอังเปานี้ถูกใช้ไปแล้ว',
        alreadyRedeemed: true
      });
    }

    // บันทึกประวัติการเติมเงิน
    const topupRecord = new Topup({
      userId: userId,
      userName: userName || user.name,
      amount: amount,
      points: pointsToAdd,
      method: 'wallet',
      voucherCode: voucherCode,
      provider: provider || 'unknown',
      status: 'success', // อังเปารับเงินสำเร็จทันที ไม่ต้องรออนุมัติ
      createdAt: new Date()
    });
    
    await topupRecord.save();

    // ส่ง response กลับ
    return res.status(200).json({
      success: true,
      message: `เพิ่มแต้มสำเร็จ ${pointsToAdd} พ้อยท์`,
      data: {
        oldPoints,
        addedPoints: pointsToAdd,
        newPoints,
        topupId: topupRecord._id
      }
    });

  } catch (error) {
    console.error('Add points error:', error);
    
    // บันทึก error ลง database
    try {
      const errorTopup = new Topup({
        userId: userId,
        userName: userName || 'Unknown',
        amount: amount,
        points: 0,
        method: 'wallet',
        voucherCode: voucherCode,
        provider: provider || 'unknown',
        status: 'rejected',
        errorMessage: error.message,
        createdAt: new Date()
      });
      await errorTopup.save();
    } catch (logError) {
      console.error('Failed to save error log:', logError);
    }
    
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มแต้ม',
      error: error.message
    });
  }
}