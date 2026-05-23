import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const uploadDir = path.join(process.cwd(), "public/uploads");
  fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    filename: (name, ext, part) => `${Date.now()}_${part.originalFilename}`,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ error: "Upload failed" });
    }

    const file = files.file?.[0];
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const filename = path.basename(file.filepath);
    const url = `/uploads/${filename}`;

    return res.status(200).json({ success: true, url });
  });
}
