/**
 * จัดหมวดหมู่ไฟล์ตามนามสกุล
 */

const FILE_CATEGORIES = {
  images: {
    label: '�️ รูปภาพ',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff', '.avif'],
    icon: '',
  },
  documents: {
    label: '📄 เอกสาร',
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.json', '.xml'],
    icon: '',
  },
  archives: {
    label: '📦 ไฟล์บีบอัด',
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.iso', '.scs'],
    icon: '',
  },
  executables: {
    label: '⚙️ ไฟล์โปรแกรม',
    extensions: ['.exe', '.msi', '.dmg', '.pkg', '.app', '.apk', '.ipa'],
    icon: '',
  },
  videos: {
    label: '🎬 วิดีโอ',
    extensions: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp'],
    icon: '',
  },
  audio: {
    label: '🎵 เสียง',
    extensions: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus'],
    icon: '',
  },
  others: {
    label: '📁 อื่นๆ',
    extensions: [],
    icon: '',
  },
};

/**
 * หาหมวดหมู่ของไฟล์
 */
export function getFileCategory(fileName) {
  if (!fileName) return FILE_CATEGORIES.others;
  
  const ext = '.' + fileName.split('.').pop()?.toLowerCase();
  
  for (const [key, category] of Object.entries(FILE_CATEGORIES)) {
    if (key === 'others') continue;
    if (category.extensions.includes(ext)) {
      return { key, ...category };
    }
  }
  
  return { key: 'others', ...FILE_CATEGORIES.others };
}

/**
 * จัดกลุ่มไฟล์ตามหมวดหมู่
 */
export function groupFilesByCategory(urls) {
  const grouped = {};
  
  urls.forEach(url => {
    const fileName = url.split('/').pop();
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
  
  // ✅ เรียงตามลำดับที่ต้องการ
  const order = ['images', 'archives', 'documents', 'executables', 'videos', 'audio', 'others'];
  
  return order
    .filter(key => grouped[key])
    .map(key => grouped[key]);
}

/**
 * ตรวจสอบว่าเป็นไฟล์รูปภาพหรือไม่
 */
export function isImageFile(fileName) {
  const ext = '.' + fileName?.split('.').pop()?.toLowerCase();
  return FILE_CATEGORIES.images.extensions.includes(ext);
}

/**
 * ฟอร์แมตขนาดไฟล์
 */
export function formatFileSize(bytes) {
  if (!bytes) return 'Unknown';
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
}