import { useEffect, useState } from "react";
import styles from "../styles/PageLoader.module.css";

// Intro แบบ liquid glass — เล่นครั้งแรกที่เข้าเว็บต่อ session แล้วละลายหายไป
// หน้าเว็บจริง render อยู่ข้างใต้แล้ว ไม่ต้องรอ loader
export default function PageLoader() {
  const [phase, setPhase] = useState("show"); // show → melt → gone
  const word = "xCloud";

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("lg-intro") === "1";
      sessionStorage.setItem("lg-intro", "1");
    } catch {}

    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("gone");
      return;
    }

    const melt = setTimeout(() => setPhase("melt"), 1500);
    const gone = setTimeout(() => setPhase("gone"), 2200);
    return () => {
      clearTimeout(melt);
      clearTimeout(gone);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div className={`${styles.pageLoader} ${phase === "melt" ? styles.fadeOut : ""}`} aria-hidden="true">
      <div className={styles.orbStage}>
        <div className={styles.goo}>
          <div className={styles.orb} />
          <div className={`${styles.orb} ${styles.orbB}`} />
          <div className={`${styles.orb} ${styles.orbC}`} />
        </div>
        <div className={styles.lens}>
          <img src="/favicon.ico" alt="" className={styles.logo} />
        </div>
      </div>

      <div className={styles.textContainer}>
        {word.split("").map((char, i) => (
          <span key={i} className={styles.char} style={{ animationDelay: `${0.25 + i * 0.07}s` }}>
            {char}
          </span>
        ))}
        <span className={styles.studio}>Studio</span>
      </div>

      <div className={styles.progress}>
        <span className={styles.progressFill} />
      </div>
    </div>
  );
}
