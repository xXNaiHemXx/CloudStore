import { useEffect, useState } from "react";
import styles from "./Toast.module.css";
import Icon from "./Icon"; //  เพิ่ม import Icon

export default function Toast({ message, type, onClose, duration = 3000 }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  //  เปลี่ยนเป็นใช้ Icon Component
  const getIconName = () => {
    switch (type) {
      case "success":
        return "success";
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "info";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "#10b981";
      case "error":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      case "info":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className={`${styles.toast} ${styles[type]} ${isExiting ? styles.exit : ""}`}>
      <div className={styles.toastIcon}>
        <Icon name={getIconName()} size="1.3rem" color={getIconColor()} />
      </div>
      <div className={styles.toastContent}>
        <p className={styles.toastMessage}>{message}</p>
      </div>
      <button className={styles.toastClose} onClick={() => {
        setIsExiting(true);
        setTimeout(onClose, 300);
      }}>
        <Icon name="close" size="0.8rem" color="#6b7280" />
      </button>
    </div>
  );
}