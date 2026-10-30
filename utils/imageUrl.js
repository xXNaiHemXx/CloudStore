// รูปสินค้าบน R2 เป็น PNG 1920x1080 ขนาด 1-3MB แต่การ์ดโชว์แค่ ~300px
// ส่งผ่านตัวย่อรูปของ Next (/_next/image) ให้ได้ WebP ขนาดพอดีแทน ลดทั้งเวลาโหลดและเวลา decode
// width ต้องอยู่ใน images.deviceSizes / imageSizes ของ Next (เช่น 256, 384, 640, 1080, 1920)
const OPTIMIZABLE = /^https:\/\/files\.xcloud-studio\.store\//;

export function thumb(src, width = 640, quality = 75) {
  if (!src || !OPTIMIZABLE.test(src)) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}
