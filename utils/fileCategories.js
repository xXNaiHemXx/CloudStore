/**
 * จัดกลุ่มไฟล์ตามหมวดหมู่
 */
export function groupFilesByCategory(urls) {
  if (!Array.isArray(urls)) return []; // ✅ กัน error
  
  const grouped = {};
  
  urls.forEach(item => {
    // ✅ รองรับทั้ง string และ object
    const url = typeof item === 'string' ? item : (item.url || '');
    const fileName = typeof item === 'string' 
      ? item.split('/').pop() 
      : (item.fileName || (item.url ? item.url.split('/').pop() : ''));
    
    if (!url || !fileName) return; // ✅ ข้ามถ้าไม่มีข้อมูล
    
    const category = getFileCategory(fileName);
    
    if (!grouped[category.key]) {
      grouped[category.key] = {
        ...category,
        files: [],
      };
    }
    
    grouped[category.key].files.push({
      url,
      fileName,
    });
  });
  
  const order = ['images', 'archives', 'documents', 'executables', 'videos', 'audio', 'others'];
  
  return order
    .filter(key => grouped[key])
    .map(key => grouped[key]);
}

/**
 * ตรวจสอบว่าเป็นไฟล์รูปภาพหรือไม่
 */
export function isImageFile(fileName) {
  if (!fileName || typeof fileName !== 'string') return false; // ✅ กัน error
  const ext = '.' + fileName.split('.').pop()?.toLowerCase();
  return FILE_CATEGORIES.images.extensions.includes(ext);
}