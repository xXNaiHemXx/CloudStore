import axios from 'axios';

const LOG_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  PURCHASE: 'purchase',
  TOPUP: 'topup',
  PRODUCT_ADD: 'product_add',
  PRODUCT_EDIT: 'product_edit',
  PRODUCT_DELETE: 'product_delete',
  PRODUCT_UPDATE: 'product_update',
  USER_EDIT: 'user_edit',
  FILE_UPLOAD: 'file_upload',
  FILE_DELETE: 'file_delete',
  SETTINGS: 'settings',
  ERROR: 'error',
};

async function addLog(type, title, message, user = 'System', details = {}) {
  try {
    // เซิร์ฟเวอร์เป็นคนบันทึก + ส่ง webhook เอง และจะใช้ชื่อผู้ใช้จาก session แทนค่าที่ส่งไป
    await axios.post('/api/admin/logs', { type, title, message, user, details });
  } catch (err) {
    console.error('Logger error:', err.message);
  }
}

export { addLog, LOG_TYPES };
