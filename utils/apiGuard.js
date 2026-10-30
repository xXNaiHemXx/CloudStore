// utils/apiGuard.js
//
// ตัวช่วยป้องกัน API ฝั่งเซิร์ฟเวอร์: rate limit, ตรวจ Origin (กัน CSRF), จำกัด method

// ---------- Rate limit (in-memory, ต่อ IP + key) ----------
// พอสำหรับเซิร์ฟเวอร์ตัวเดียว ถ้าขยายหลายเครื่องควรย้ายไปใช้ Redis
const buckets = global.__rateBuckets || (global.__rateBuckets = new Map());

export function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

// คืน true ถ้ายังไม่เกิน, ถ้าเกินจะตอบ 429 ให้เองและคืน false
export function rateLimit(req, res, { key = "global", limit = 60, windowMs = 60_000, id } = {}) {
  const who = id || getClientIp(req);
  const bucketKey = `${key}:${who}`;
  const now = Date.now();
  const entry = buckets.get(bucketKey);

  if (!entry || now > entry.reset) {
    buckets.set(bucketKey, { count: 1, reset: now + windowMs });
  } else {
    entry.count += 1;
    if (entry.count > limit) {
      res.setHeader("Retry-After", Math.ceil((entry.reset - now) / 1000));
      res.status(429).json({ error: "ทำรายการถี่เกินไป กรุณารอสักครู่" });
      return false;
    }
  }

  // เก็บกวาด bucket ที่หมดอายุเป็นระยะ กัน memory โต
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
  }
  return true;
}

// ---------- Same-origin check (กัน CSRF) ----------
// request ที่เปลี่ยนข้อมูล (POST/PUT/PATCH/DELETE) ต้องมาจากโดเมนเดียวกันเท่านั้น
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function sameOrigin(req, res) {
  if (SAFE_METHODS.has(req.method)) return true;

  const origin = req.headers.origin || req.headers.referer;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  if (!origin || !host) {
    res.status(403).json({ error: "Forbidden - missing origin" });
    return false;
  }

  try {
    if (new URL(origin).host === host) return true;
  } catch {}

  res.status(403).json({ error: "Forbidden - cross-site request" });
  return false;
}

export function allowMethods(req, res, methods) {
  if (methods.includes(req.method)) return true;
  res.setHeader("Allow", methods.join(", "));
  res.status(405).json({ error: "Method not allowed" });
  return false;
}

// ข้อความ error ที่ส่งกลับ client ไม่ควรมีรายละเอียดภายใน (stack, ชื่อ collection ฯลฯ)
export function serverError(res, error, label = "API") {
  console.error(`❌ [${label}]`, error);
  return res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
}

// ตรวจว่าเป็น Mongo ObjectId ที่ถูกต้อง (กัน NoSQL injection ผ่าน object เช่น { $ne: null })
export function isObjectId(value) {
  return typeof value === "string" && /^[a-f0-9]{24}$/i.test(value);
}

export function isDiscordId(value) {
  return typeof value === "string" && /^\d{15,25}$/.test(value);
}
