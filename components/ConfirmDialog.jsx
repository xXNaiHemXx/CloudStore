import { useEffect } from "react";
import styles from "./ConfirmDialog.module.css";
import Icon from "./Icon"; //  เพิ่ม import Icon

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  type = "warning",
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  //  เปลี่ยนเป็นใช้ Icon Component
  const getIconName = () => {
    switch (type) {
      case "danger":
        return "warning";
      case "warning":
        return "warning";
      case "success":
        return "success";
      case "info":
        return "info";
      default:
        return "warning";
    }
  };

  const getIconBgColor = () => {
    switch (type) {
      case "danger":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      case "success":
        return "#10b981";
      case "info":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case "danger":
        return styles.titleDanger;
      case "warning":
        return styles.titleWarning;
      case "success":
        return styles.titleSuccess;
      default:
        return styles.titleInfo;
    }
  };

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dialogContent}>
          <div className={`${styles.icon} ${styles[type]}`}>
            <Icon name={getIconName()} size="2rem" color="#ffffff" />
          </div>
          
          <h3 className={`${styles.title} ${getTitleColor()}`}>
            {title || (type === "danger" ? "ยืนยันการลบ?" : "ยืนยันการดำเนินการ?")}
          </h3>
          
          <p className={styles.message}>{message}</p>
          
          <div className={styles.buttons}>
            <button className={styles.cancelBtn} onClick={onCancel}>
              <Icon name="close" size="0.8rem" />
              <span>{cancelText}</span>
            </button>
            <button className={`${styles.confirmBtn} ${styles[type]}`} onClick={onConfirm}>
              <Icon name="check" size="0.8rem" color="#ffffff" />
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}