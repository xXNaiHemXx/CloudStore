// utils/serverLogWriter.js
//
// ⚠️ ใช้ฝั่งเซิร์ฟเวอร์ (API routes) เท่านั้น
// เขียนลง data/logs.json ตรงๆ แทนการยิง axios.post('/api/admin/logs', ...) จากใน API route เอง
// (เดิม pages/api/admin/logs.js มี logic เขียนไฟล์อยู่แล้ว แต่ฟังก์ชันนี้แยกออกมาให้เรียกใช้ตรง
//  จากไฟล์อื่นได้โดยไม่ต้องยิง HTTP request ย้อนกลับเข้าเซิร์ฟเวอร์ตัวเอง)

import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "data", "logs.json");

function ensureLogFile() {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, "[]");
}

function readLogs() {
  ensureLogFile();
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeLogs(logs) {
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

/**
 * บันทึก log ลงไฟล์โดยตรง (เรียกจากฝั่งเซิร์ฟเวอร์เท่านั้น เช่นใน pages/api/**)
 */
export async function writeLogDirect(type, title, message, user = "System", details = {}) {
  const logs = readLogs();
  logs.push({
    _id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    type,
    title,
    message,
    user,
    details,
    createdAt: new Date().toISOString(),
  });
  writeLogs(logs);
}