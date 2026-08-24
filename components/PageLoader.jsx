import { useState, useEffect } from "react";
import styles from "../styles/PageLoader.module.css";

export default function PageLoader({ children, isLoading = false }) {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  const [revealProgress, setRevealProgress] = useState(0); // ✅ 0-1 สำหรับไล่สี
  const fullText = "xCloud";

  // ✅ ใช้ isLoading prop จากภายนอก
  useEffect(() => {
    if (!isLoading) {
      setFadeOut(true);
      setTimeout(() => {
        setLoading(false);
      }, 800);
    } else {
      setLoading(true);
      setFadeOut(false);
      setTextIndex(0);
      setRevealProgress(0);
    }
  }, [isLoading]);

  // ✅ แสดงตัวอักษรทีละตัว
  useEffect(() => {
    if (!loading || fadeOut) return;

    const interval = setInterval(() => {
      setTextIndex((prev) => {
        if (prev < fullText.length) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 120);

    return () => clearInterval(interval);
  }, [loading, fadeOut]);

  // ✅ เมื่อแสดงครบแล้ว เริ่มไล่สีหาย
  useEffect(() => {
    if (textIndex >= fullText.length && !fadeOut) {
      // รอ 0.5s แล้วเริ่มไล่สีหาย
      const timer = setTimeout(() => {
        const progressInterval = setInterval(() => {
          setRevealProgress((prev) => {
            if (prev < 1) {
              return prev + 0.02; // ความเร็วในการไล่สี
            }
            clearInterval(progressInterval);
            return 1;
          });
        }, 30);

        return () => clearInterval(progressInterval);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [textIndex, fadeOut]);

  // ✅ เมื่อไล่สีครบ 100% แล้วจางหาย
  useEffect(() => {
    if (revealProgress >= 1 && !fadeOut) {
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [revealProgress, fadeOut]);

  // ✅ Fallback
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !fadeOut) {
        setFadeOut(true);
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    }, 8000);

    return () => clearTimeout(timeout);
  }, [loading, fadeOut]);

  if (!loading) {
    return children;
  }

  return (
    <div className={`${styles.pageLoader} ${fadeOut ? styles.fadeOut : ''}`}>
      <div className={styles.blurBackground}></div>
      <div className={styles.loaderContent}>
        
        {/* Logo */}
        <div className={styles.logoContainer}>
          <div className={styles.logoGlow}></div>
          <img src="/logo.png" alt="xCloud" className={styles.logo} />
        </div>

        {/* ✅ ตัวอักษร xCloud - แสดงแล้วค่อยๆหายไล่จากหัวไปท้าย */}
        <div className={styles.textContainer}>
          {fullText.split("").map((char, charIndex) => {
            // ✅ คำนวณว่า char นี้ถูกเปิดเผยแค่ไหน
            const charStart = charIndex / fullText.length;
            const charEnd = (charIndex + 1) / fullText.length;
            
            // ✅ progress ของ char นี้ (0-1)
            let charProgress = 0;
            if (revealProgress > charStart) {
              charProgress = Math.min((revealProgress - charStart) / (charEnd - charStart), 1);
            }

            // ✅ แสดงเฉพาะตัวอักษรที่แสดงแล้ว
            const isVisible = charIndex < textIndex;
            
            return (
              <span
                key={charIndex}
                className={`${styles.char} ${isVisible ? styles.charVisible : ''}`}
                style={{
                  transitionDelay: `${charIndex * 50}ms`,
                  // ✅ ใช้ clip-path เพื่อไล่สีจากซ้ายไปขวา
                  clipPath: isVisible ? `inset(0 ${100 - (charProgress * 100)}% 0 0)` : 'inset(0 100% 0 0)',
                  opacity: isVisible ? 1 : 0,
                }}
              >
                {char}
              </span>
            );
          })}
        </div>

        {/* ✅ แสดงสถานะ */}
        <p className={styles.loadingText}>
          {textIndex < fullText.length 
            ? "กำลังโหลด" 
            : revealProgress < 1 
              ? "กำลังโหลด" 
              : "พร้อมใช้งาน"
          }
        </p>
      </div>
    </div>
  );
}