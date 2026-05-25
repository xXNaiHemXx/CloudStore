import { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/Toast";
import styles from "../components/Toast.module.css";

const ToastContext = createContext();

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info", duration = 3000) => {
    const id = toastId++;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const success = useCallback((message, duration = 3000) => {
    showToast(message, "success", duration);
  }, [showToast]);

  const error = useCallback((message, duration = 3000) => {
    showToast(message, "error", duration);
  }, [showToast]);

  const warning = useCallback((message, duration = 3000) => {
    showToast(message, "warning", duration);
  }, [showToast]);

  const info = useCallback((message, duration = 3000) => {
    showToast(message, "info", duration);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}