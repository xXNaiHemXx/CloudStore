export default async function handler(req, res) {
  const { fileId } = req.query;
  
  if (!fileId) {
    return res.status(400).json({ error: 'Missing fileId' });
  }
  
  // ✅ Redirect ไป Google Drive direct download + bypass virus warning
  const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  
  res.redirect(302, driveUrl);
}