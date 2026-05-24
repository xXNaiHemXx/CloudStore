/**
 * แปลง Google Drive URL เป็น Direct Download Link
 * @param {string} url - Google Drive URL
 * @returns {string} Direct download URL
 */
export function convertGoogleDriveUrl(url) {
  if (!url) return url;
  
  // ถ้าไม่ใช่ Google Drive URL ให้ return เดิม
  if (!url.includes('drive.google.com')) return url;
  
  // รูปแบบ Google Drive URL:
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // https://drive.google.com/file/d/FILE_ID/view
  // https://drive.google.com/open?id=FILE_ID
  // https://drive.google.com/uc?id=FILE_ID&export=download
  
  let fileId = null;
  
  // Pattern 1: /file/d/FILE_ID/
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) {
    fileId = fileIdMatch[1];
  }
  
  // Pattern 2: ?id=FILE_ID
  if (!fileId) {
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch) {
      fileId = idMatch[1];
    }
  }
  
  // Pattern 3: /folders/FILE_ID (โฟลเดอร์ - ไม่รองรับ direct download)
  if (url.includes('/folders/')) {
    console.warn('⚠️ Google Drive folders ไม่รองรับ direct download');
    return url;
  }
  
  if (fileId) {
    // ✅ Direct download link
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  
  return url;
}

/**
 * แปลง Dropbox URL เป็น Direct Download Link
 */
export function convertDropboxUrl(url) {
  if (!url || !url.includes('dropbox.com')) return url;
  
  // เปลี่ยน ?dl=0 เป็น ?dl=1 (direct download)
  return url.replace('?dl=0', '?dl=1');
}

/**
 * แปลง MEGA URL เป็น Direct Download (ถ้าเป็นไปได้)
 */
export function convertMegaUrl(url) {
  if (!url || !url.includes('mega.nz')) return url;
  
  // MEGA URL มักจะ direct download ได้อยู่แล้ว
  return url;
}

/**
 * แปลงลิงก์ Cloud Storage ต่างๆ เป็น Direct Download
 */
export function getDirectDownloadUrl(url) {
  if (!url) return url;
  
  // Google Drive
  if (url.includes('drive.google.com')) {
    return convertGoogleDriveUrl(url);
  }
  
  // Dropbox
  if (url.includes('dropbox.com')) {
    return convertDropboxUrl(url);
  }
  
  // MEGA
  if (url.includes('mega.nz')) {
    return convertMegaUrl(url);
  }
  
  // ถ้าเป็น direct link อยู่แล้ว (.zip, .rar, .7z, .exe)
  if (/\.(zip|rar|7z|exe|msi|dmg|pkg|iso)$/i.test(url)) {
    return url;
  }
  
  return url;
}

/**
 * ตรวจสอบว่าเป็นลิงก์ Cloud Storage หรือไม่
 */
export function isCloudStorageUrl(url) {
  if (!url) return false;
  
  const cloudProviders = [
    'drive.google.com',
    'dropbox.com',
    'mega.nz',
    'mediafire.com',
    'onedrive.live.com',
  ];
  
  return cloudProviders.some(provider => url.includes(provider));
}