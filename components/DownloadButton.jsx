// components/DownloadButton.jsx
import { useState } from 'react';
import { getDirectDownloadUrl, isCloudStorageUrl } from '../utils/driveDownload';

export default function DownloadButton({ fileUrl, fileName, className }) {
  const [downloading, setDownloading] = useState(false);
  
  const handleDownload = async (e) => {
    e.preventDefault();
    
    if (!fileUrl) {
      alert('❌ ไม่พบลิงก์ดาวน์โหลด');
      return;
    }
    
    setDownloading(true);
    
    try {
      //  แปลงเป็น direct download URL
      const directUrl = getDirectDownloadUrl(fileUrl);
      
      //  วิธีที่ 1: ใช้ <a> tag (recommended)
      const link = document.createElement('a');
      link.href = directUrl;
      link.download = fileName || ''; // ระบุชื่อไฟล์ (ถ้ามี)
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      //  วิธีที่ 2: ใช้ fetch + blob (สำหรับ Google Drive)
      // ถ้าเป็น Google Drive อาจต้องใช้วิธีนี้เพราะมี redirect
      if (isCloudStorageUrl(fileUrl)) {
        setTimeout(async () => {
          try {
            const response = await fetch(directUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const blobLink = document.createElement('a');
            blobLink.href = blobUrl;
            blobLink.download = fileName || 'download';
            document.body.appendChild(blobLink);
            blobLink.click();
            document.body.removeChild(blobLink);
            window.URL.revokeObjectURL(blobUrl);
          } catch (fetchError) {
            console.error('❌ Fetch download error:', fetchError);
            // ถ้า fetch ไม่ได้ (CORS) ให้เปิดในแท็บใหม่
            window.open(directUrl, '_blank');
          }
        }, 500);
      }
      
    } catch (error) {
      console.error('❌ Download error:', error);
      alert('❌ ไม่สามารถดาวน์โหลดไฟล์ได้');
    } finally {
      setDownloading(false);
    }
  };
  
  return (
    <button
      onClick={handleDownload}
      disabled={downloading || !fileUrl}
      className={className}
    >
      {downloading ? '⏳ กำลังดาวน์โหลด...' : '📥 ดาวน์โหลด'}
    </button>
  );
}