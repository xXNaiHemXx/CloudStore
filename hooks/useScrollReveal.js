// hooks/useScrollReveal.js
import { useEffect, useRef, useState } from 'react';

export function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // ถ้าต้องการให้แสดงแค่ครั้งเดียว
            if (options.once !== false) {
              observer.unobserve(entry.target);
            }
          } else {
            // ถ้าต้องการให้ซ่อนเมื่อเลื่อนออก (false = แสดงครั้งเดียว)
            if (options.once === false) {
              setIsVisible(false);
            }
          }
        });
      },
      {
        threshold: options.threshold || 0.15,
        rootMargin: options.rootMargin || '0px 0px -50px 0px',
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [options.once, options.threshold, options.rootMargin]);

  return { ref, isVisible };
}