import formidable from "formidable";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { requireUser } from "@/utils/checkAdmin";
import { sameOrigin, rateLimit } from "@/utils/apiGuard";
import { IMAGE_MIME } from "@/utils/uploadPolicy";

export const config = {
  api: {
    bodyParser: false,
  },
};

const EXT_BY_MIME = { "image/jpeg": ".jpg", "image/jpg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

// ตรวจ magic bytes ของไฟล์จริง (ไม่เชื่อนามสกุล/mimetype ที่ client บอก)
function looksLikeImage(filePath) {
  const buf = Buffer.alloc(12);
  const fd = fs.openSync(filePath, "r");
  try { fs.readSync(fd, buf, 0, 12, 0); } finally { fs.closeSync(fd); }
  const isJpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const isPng = buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP";
  return isJpg || isPng || isWebp;
}

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });
  if (!sameOrigin(req, res)) return;

  const me = await requireUser(req, res);
  if (!me) return;
  if (!rateLimit(req, res, { key: "slip-upload", limit: 10, id: me.userId })) return;

  const uploadDir = path.join(process.cwd(), "public", "slip");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({
    uploadDir,
    maxFileSize: 5 * 1024 * 1024, // สลิปไม่ควรเกิน 5MB
    maxFiles: 1,
    filename: () => `tmp_${crypto.randomBytes(12).toString("hex")}`,
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error("Upload error:", err.message);
      return res.status(400).json({ error: "ไม่สามารถอัปโหลดสลิปได้ (ไฟล์ต้องไม่เกิน 5MB)" });
    }

    let slipFile = files.slip;
    if (Array.isArray(slipFile)) slipFile = slipFile[0];

    if (!slipFile || !slipFile.filepath) {
      return res.status(400).json({ error: "ไม่สามารถอ่านไฟล์สลิปได้" });
    }

    if (!IMAGE_MIME.has(slipFile.mimetype) || !looksLikeImage(slipFile.filepath)) {
      try { fs.unlinkSync(slipFile.filepath); } catch {}
      return res.status(400).json({ error: "รองรับเฉพาะไฟล์รูป jpg, png, webp" });
    }

    const fileName = `${crypto.randomBytes(16).toString("hex")}${EXT_BY_MIME[slipFile.mimetype]}`;
    fs.renameSync(slipFile.filepath, path.join(uploadDir, fileName));

    return res
      .status(200)
      .json({ message: "อัปโหลดสำเร็จ", fileUrl: `/slip/${fileName}` });
  });
}
