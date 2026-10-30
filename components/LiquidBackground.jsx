import { useEffect, useRef } from "react";

// พื้นหลัง aurora เคลื่อนไหว + ไฟส่องตามเมาส์ ใช้ร่วมกันทุกหน้า (วางไว้ใน _app)
export default function LiquidBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;

    let frame = 0;
    let x = 50, y = 30;
    const onMove = (e) => {
      x = (e.clientX / window.innerWidth) * 100;
      y = (e.clientY / window.innerHeight) * 100;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--cursor-x", `${x}%`);
        el.style.setProperty("--cursor-y", `${y}%`);
        frame = 0;
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="lg-bg" ref={ref} aria-hidden="true">
      <div className="lg-blob lg-blob--1" />
      <div className="lg-blob lg-blob--2" />
      <div className="lg-blob lg-blob--3" />
      <div className="lg-blob lg-blob--4" />
      <div className="lg-grid" />
      <div className="lg-spotlight" />
      <div className="lg-noise" />
    </div>
  );
}
