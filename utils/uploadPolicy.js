// utils/uploadPolicy.js
// ไฟล์ที่เบราว์เซอร์รันเป็นโค้ดได้ ห้ามวางใน public/ เพราะจะกลายเป็น stored XSS / หน้า phishing บนโดเมนเรา
const BLOCKED_EXT = new Set([
  ".html", ".htm", ".xhtml", ".shtml", ".svg", ".svgz", ".xml", ".js", ".mjs", ".cjs",
  ".jsx", ".ts", ".tsx", ".php", ".phtml", ".asp", ".aspx", ".jsp", ".cgi", ".sh", ".bat",
  ".cmd", ".ps1", ".htaccess", ".swf",
]);

export function isBlockedUpload(fileName) {
  const lower = String(fileName || "").toLowerCase().trim();
  const dot = lower.lastIndexOf(".");
  if (dot === -1) return false;
  return BLOCKED_EXT.has(lower.slice(dot)) || lower.startsWith(".");
}

export const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/jpg", "image/webp"]);
