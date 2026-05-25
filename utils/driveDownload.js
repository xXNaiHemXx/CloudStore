/**
 * ==================== DOWNLOAD UTILITY ====================
 * รองรับ: Discord CDN, Google Drive (bypass virus warning), Dropbox, Direct Links
 */

/**
 * ตรวจสอบว่าเป็น Discord CDN URL หรือไม่
 */
export function isDiscordCdnUrl(url) {
  if (!url) return false;
  return url.includes('cdn.discordapp.com') || 
         url.includes('discord.com/attachments') ||
         url.includes('media.discordapp.net');
}

/**
 * ตรวจสอบว่าเป็น Google Drive URL หรือไม่
 */
export function isGoogleDriveUrl(url) {
  if (!url) return false;
  return url.includes('drive.google.com');
}

/**
 * ตรวจสอบว่าเป็น Direct Link หรือไม่
 */
export function isDirectFileUrl(url) {
  if (!url) return false;
  return /\.(zip|rar|7z|exe|msi|dmg|pkg|iso|scs|zipx)$/i.test(url);
}

/**
 * แปลง Google Drive URL เป็น Direct Download Link
 * ✅ เพิ่ม confirm=XXX เพื่อ bypass virus warning
 */
export function convertGoogleDriveUrl(url) {
  if (!url || !url.includes('drive.google.com')) return url;
  
  let fileId = null;
  
  // Pattern 1: /file/d/FILE_ID/
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) fileId = fileIdMatch[1];
  
  // Pattern 2: ?id=FILE_ID
  if (!fileId) {
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch) fileId = idMatch[1];
  }
  
  // Pattern 3: /open?id=FILE_ID
  if (!fileId) {
    const openIdMatch = url.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
    if (openIdMatch) fileId = openIdMatch[1];
  }
  
  if (fileId) {
    //  วิธีที่ 1: ใช้ confirm=t (ข้ามหน้าไวรัส) + export=download
    return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  }
  
  return url;
}

/**
 * แปลง Dropbox URL เป็น Direct Download Link
 */
export function convertDropboxUrl(url) {
  if (!url || !url.includes('dropbox.com')) return url;
  return url.replace('?dl=0', '?dl=1');
}

/**
 * แปลงเป็น Direct Download URL
 */
export function getDirectDownloadUrl(url) {
  if (!url) return url;
  
  // Discord CDN & Direct Files → ไม่ต้องแปลง
  if (isDiscordCdnUrl(url) || isDirectFileUrl(url)) {
    return url;
  }
  
  // Google Drive → แปลง + bypass virus warning
  if (isGoogleDriveUrl(url)) {
    return convertGoogleDriveUrl(url);
  }
  
  // Dropbox → แปลง
  if (url.includes('dropbox.com')) {
    return convertDropboxUrl(url);
  }
  
  return url;
}

/**
 * ดาวน์โหลดไฟล์จาก Google Drive ผ่าน API Proxy (ข้ามทุกข้อจำกัด)
 * @param {string} fileId - Google Drive File ID
 * @param {string} fileName - ชื่อไฟล์
 */
export async function downloadGoogleDriveFile(fileId, fileName) {
  try {
    //  ใช้ API Proxy ของเราเอง
    const proxyUrl = `/api/download/drive?fileId=${fileId}`;
    
    const link = document.createElement('a');
    link.href = proxyUrl;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('❌ Google Drive download error:', error);
    
    //  Fallback: ใช้ direct URL
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
    window.open(directUrl, '_blank');
    return false;
  }
}

/**
 * ดึง File ID จาก Google Drive URL
 */
export function getGoogleDriveFileId(url) {
  if (!url) return null;
  
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) return fileIdMatch[1];
  
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  
  return null;
}

/**
 * ดาวน์โหลดไฟล์ (Smart Version)
 */
export async function downloadFile(url, fileName) {
  if (!url) {
    throw new Error('URL is required');
  }
  
  //  Google Drive: ใช้วิธีพิเศษ
  if (isGoogleDriveUrl(url)) {
    const fileId = getGoogleDriveFileId(url);
    
    if (fileId) {
      //  วิธีที่ 1: ใช้ iframe invisible (ข้ามทุกหน้า)
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
      document.body.appendChild(iframe);
      
      //  วิธีที่ 2: ใช้ <a> tag พร้อม confirm=t
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
        link.download = fileName || 'download';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // ลบ iframe
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 2000);
      }, 500);
      
      return true;
    }
  }
  
  //  ประเภทอื่น: ใช้ <a> tag
  const directUrl = getDirectDownloadUrl(url);
  
  const link = document.createElement('a');
  link.href = directUrl;
  link.download = fileName || '';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  return true;
}