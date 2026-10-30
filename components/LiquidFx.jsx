import { useEffect } from "react";

// ================================================================
// LiquidFx — ติด animation ให้ทุกหน้าโดยอัตโนมัติ
// อ่านชื่อ class ของ CSS Modules (เช่น Home_productCard__x7Y2) แล้วใส่ data-lg-* ให้
//   data-lg-sheen   แสงสะท้อนแก้ว + ขอบเรืองแสงวิ่งตามเมาส์
//   data-lg-tilt    การ์ดเอียง 3D ตามเมาส์
//   data-lg-magnet  ปุ่มหลักดูดเข้าหาเมาส์
//   data-lg-reveal  ค่อยๆ ลอยขึ้นตอนเลื่อนมาเห็น (stagger ตามลำดับ)
//   + ripple ตอนคลิกปุ่มทุกปุ่ม
// ใช้ data-attribute แทน className เพราะ React จะเขียน className ทับทุกครั้งที่ render
// ================================================================

const TILT = /^(product|recommended|team|feature|method|r2File|bestSeller)Card(Premium|Featured)?$/;
const SURFACE = /(Card|Box|Panel|Item|Chip|Tile)(Premium|Featured|Full)?$/;
const SURFACE_EXCLUDE = /(Skeleton|Image|Overlay|Badge|Tag|Icon|Thumb|Avatar|Name|Price|Info|Desc|Foot|Header|Stats|Bg|Wrapper|Empty|Remove|Download|Roles|Count|Action|Btn)/;
const MAGNET = /^(btn[A-Z]\w*|loginBtn|userBtn|buyButton|submitBtn|glassBtnPrimary|addButtonPremium|emptyAddBtn|modalSubmitBtnPremium|quickActionBtnPremium|teamFollowBtn|recommendedView)$/;
// (ส่วน hero ของแต่ละหน้ามี animation เข้าใน CSS อยู่แล้ว จึงไม่ใส่ไว้ตรงนี้ กันเล่นซ้อนกัน)
const REVEAL = /^(sectionHeader|teamHeader|pageHeader|welcomeSection|quickActionsPremium|recentActivity|statsGrid|statsCard|featuresGrid|contactSection|recommendedSection)$/;
const NO_REVEAL_INSIDE = '[class*="odal"],[class*="ightbox"],[class*="oast"],[class*="onfirm"],[class*="sidebar"],[class*="dropdown"],[class*="Dropdown"]';

function localNames(el) {
  const cls = typeof el.className === "string" ? el.className : el.getAttribute?.("class") || "";
  const out = [];
  for (const token of cls.split(/\s+/)) {
    if (!token) continue;
    // webpack: File_local__hash  |  turbopack: File-module__hash__local
    let m = token.match(/^[^_]+_([A-Za-z0-9]+)__[\w-]+$/) || token.match(/__([A-Za-z][A-Za-z0-9]*)$/);
    out.push(m ? m[1] : token);
  }
  return out;
}

const pseudoUsed = (el, which) => {
  const c = getComputedStyle(el, which).content;
  return c && c !== "none" && c !== "normal";
};

function enhance(el, ctx) {
  if (ctx.seen.has(el)) return;
  ctx.seen.add(el);

  const names = localNames(el);
  if (!names.length) return;

  const isButton = el.tagName === "BUTTON" || (el.tagName === "A" && names.some((n) => /btn|Btn|Button/.test(n)));
  const isTilt = names.some((n) => TILT.test(n));
  const isSurface = isTilt || names.some((n) => SURFACE.test(n) && !SURFACE_EXCLUDE.test(n.replace(/(Card|Box|Panel|Item|Chip|Tile)(Premium|Featured|Full)?$/, "")));

  if (ctx.finePointer && (isSurface || isButton)) {
    if (!pseudoUsed(el, "::after")) {
      el.setAttribute("data-lg-sheen", pseudoUsed(el, "::before") ? "sheen-only" : "");
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
    }
  }

  if (ctx.finePointer && isTilt) el.setAttribute("data-lg-tilt", "");
  if (ctx.finePointer && names.some((n) => MAGNET.test(n))) el.setAttribute("data-lg-magnet", "");

  const wantsReveal = isTilt || names.some((n) => REVEAL.test(n)) || (isSurface && !isButton);
  if (wantsReveal && !ctx.reduced && el.getAttribute("data-lg-reveal") !== "in" && !el.closest(NO_REVEAL_INSIDE)) {
    const rect = el.getBoundingClientRect();
    // ของที่อยู่ในจอตั้งแต่แรกก็ยังเล่น animation แต่เร็วกว่า
    const siblings = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
    el.style.setProperty("--lg-delay", `${Math.min(siblings, 10) * 70}ms`);
    el.setAttribute("data-lg-reveal", "");
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      requestAnimationFrame(() => requestAnimationFrame(() => el.setAttribute("data-lg-reveal", "in")));
    } else {
      ctx.io.observe(el);
    }
  }
}

function scan(root, ctx) {
  if (root.nodeType !== 1) return;
  if (root.hasAttribute("class")) enhance(root, ctx);
  root.querySelectorAll("[class]").forEach((el) => enhance(el, ctx));
}

export default function LiquidFx() {
  useEffect(() => {
    const ctx = {
      seen: new WeakSet(),
      finePointer: window.matchMedia("(hover: hover) and (pointer: fine)").matches,
      reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      io: new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.setAttribute("data-lg-reveal", "in");
              ctx.io.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
      ),
    };

    // ---------- tag DOM ----------
    let pending = [];
    let scheduled = false;
    const flush = () => {
      scheduled = false;
      const nodes = pending;
      pending = [];
      nodes.forEach((n) => n.isConnected && scan(n, ctx));
    };
    const mo = new MutationObserver((records) => {
      for (const r of records) r.addedNodes.forEach((n) => n.nodeType === 1 && pending.push(n));
      if (!scheduled && pending.length) {
        scheduled = true;
        requestAnimationFrame(flush);
      }
    });
    scan(document.body, ctx);
    mo.observe(document.body, { childList: true, subtree: true });

    // ---------- pointer effects ----------
    let tiltEl = null;
    let magnetEl = null;
    let frame = 0;
    let lastEvent = null;

    const resetTilt = () => {
      if (tiltEl) tiltEl.removeAttribute("data-lg-tilting");
      tiltEl = null;
    };
    const resetMagnet = () => {
      if (magnetEl) magnetEl.removeAttribute("data-lg-pulling");
      magnetEl = null;
    };

    const tick = () => {
      frame = 0;
      const e = lastEvent;
      if (!e) return;
      const target = e.target instanceof Element ? e.target : null;

      const sheen = target?.closest("[data-lg-sheen]");
      if (sheen) {
        const r = sheen.getBoundingClientRect();
        sheen.style.setProperty("--lg-x", `${e.clientX - r.left}px`);
        sheen.style.setProperty("--lg-y", `${e.clientY - r.top}px`);
      }

      const tilt = target?.closest("[data-lg-tilt]");
      if (tilt !== tiltEl) resetTilt();
      if (tilt) {
        tiltEl = tilt;
        const r = tilt.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.setProperty("--lg-ry", `${(px * 10).toFixed(2)}deg`);
        tilt.style.setProperty("--lg-rx", `${(-py * 10).toFixed(2)}deg`);
        tilt.setAttribute("data-lg-tilting", "");
      }

      const magnet = target?.closest("[data-lg-magnet]");
      if (magnet !== magnetEl) resetMagnet();
      if (magnet) {
        magnetEl = magnet;
        const r = magnet.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        magnet.style.setProperty("--lg-mx", `${(dx * 0.25).toFixed(1)}px`);
        magnet.style.setProperty("--lg-my", `${(dy * 0.35).toFixed(1)}px`);
        magnet.setAttribute("data-lg-pulling", "");
      }
    };

    const onMove = (e) => {
      lastEvent = e;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onLeaveWindow = () => {
      resetTilt();
      resetMagnet();
    };

    // ---------- ripple ----------
    const onDown = (e) => {
      if (ctx.reduced) return;
      const btn = e.target instanceof Element ? e.target.closest("button, a[data-lg-sheen], a[data-lg-magnet]") : null;
      if (!btn || btn.disabled) return;
      const r = btn.getBoundingClientRect();
      if (getComputedStyle(btn).position === "static") btn.style.position = "relative";

      const wrap = document.createElement("span");
      wrap.setAttribute("aria-hidden", "true");
      wrap.style.cssText = "position:absolute;inset:0;overflow:hidden;border-radius:inherit;pointer-events:none;z-index:4";
      const dot = document.createElement("span");
      const size = Math.max(r.width, r.height) * 2.2;
      dot.className = "lg-ripple";
      dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left}px;top:${e.clientY - r.top}px`;
      wrap.appendChild(dot);
      btn.appendChild(wrap);
      setTimeout(() => wrap.remove(), 750);
    };

    if (ctx.finePointer) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeaveWindow);
    }
    window.addEventListener("pointerdown", onDown, { passive: true });

    return () => {
      mo.disconnect();
      ctx.io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeaveWindow);
      window.removeEventListener("pointerdown", onDown);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
