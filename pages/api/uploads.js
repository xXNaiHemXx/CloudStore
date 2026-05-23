import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  const uploadDir = path.join(process.cwd(), "public/uploads");

  try {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

    const files = fs.readdirSync(uploadDir);
    const urls = files.map((file) => `/uploads/${file}`);
    return res.status(200).json(urls);
  } catch (error) {
    console.error("Error reading uploads:", error);
    return res.status(500).json({ error: "Unable to read uploads" });
  }
}
