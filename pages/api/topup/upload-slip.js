import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const uploadDir = path.join(process.cwd(), "public", "slip");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({ uploadDir, keepExtensions: true });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ error: "ไม่สามารถอัปโหลดสลิปได้" });
    }

    let slipFile = files.slip;
    if (Array.isArray(slipFile)) slipFile = slipFile[0];

    if (!slipFile || !slipFile.filepath) {
      return res.status(400).json({ error: "ไม่สามารถอ่านไฟล์สลิปได้" });
    }

    const fileName = path.basename(slipFile.filepath);

    console.log("Upload success:", {
      userId: fields.userId,
      amount: fields.amount,
      file: fileName,
    });

    return res
      .status(200)
      .json({ message: "อัปโหลดสำเร็จ", fileUrl: `/slip/${fileName}` });
  });
}
