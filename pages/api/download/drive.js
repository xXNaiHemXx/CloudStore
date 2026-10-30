export default async function handler(req, res) {
  const { fileId } = req.query;

  // รับเฉพาะ Google Drive file id (กันการฉีดพารามิเตอร์อื่นเข้า URL)
  if (typeof fileId !== 'string' || !/^[\w-]{10,100}$/.test(fileId)) {
    return res.status(400).json({ error: 'Missing fileId' });
  }

  //  Redirect ไป Google Drive direct download + bypass virus warning
  const driveUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}&confirm=t`;

  res.redirect(302, driveUrl);
}
