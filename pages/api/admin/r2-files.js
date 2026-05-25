import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";

const R2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  // GET - List files
  if (req.method === 'GET') {
    try {
      const command = new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET_NAME,
      });
      
      const data = await R2.send(command);
      
      const files = (data.Contents || []).map(item => ({
        key: item.Key,
        fileName: item.Key?.split('/').pop() || item.Key,
        size: item.Size,
        sizeFormatted: formatBytes(item.Size),
        lastModified: item.LastModified,
        url: `${process.env.R2_PUBLIC_URL}/${item.Key}`,
      }));

      res.status(200).json({ files });
    } catch (error) {
      console.error('R2 list error:', error);
      res.status(500).json({ error: 'Cannot list files' });
    }
  }

  // DELETE - Delete file
  else if (req.method === 'DELETE') {
    try {
      const { key } = req.query;
      
      const command = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      });
      
      await R2.send(command);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('R2 delete error:', error);
      res.status(500).json({ error: 'Cannot delete file' });
    }
  }
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

function formatBytes(bytes) {
  if (!bytes) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
}