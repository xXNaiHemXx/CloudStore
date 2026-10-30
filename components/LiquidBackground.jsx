import { useEffect, useRef } from "react";

// พื้นหลัง aurora เคลื่อนไหว + ไฟส่องตามเมาส์ ใช้ร่วมกันทุกหน้า (วางไว้ใน _app)
export default function LiquidBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    let x = 0, y = 0;
    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        el.style.setProperty("--cursor-x", `${x}px`);
        el.style.setProperty("--cursor-y", `${y}px`);
        frame = 0;
      });
    };
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (finePointer) window.addEventListener("pointermove", onMove, { passive: true });

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
