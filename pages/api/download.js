// pages/api/download.js
export default async function handler(req, res) {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'Missing URL' });
  }
  
  try {
    // ✅ ดึงไฟล์จาก Google Drive แล้วส่งต่อให้ผู้ใช้
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    // ✅ ตั้งค่า headers สำหรับดาวน์โหลด
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="download"');
    res.setHeader('Content-Length', response.headers.get('content-length'));
    res.setHeader('Cache-Control', 'no-cache');
    
    // ✅ ส่งไฟล์ต่อ
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
    
  } catch (error) {
    console.error('❌ Download proxy error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
}