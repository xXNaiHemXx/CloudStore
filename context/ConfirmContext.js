import { createContext, useContext, useState, useCallback } from "react";
import ConfirmDialog from "../components/ConfirmDialog";

const ConfirmContext = createContext();

export function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "ยืนยัน",
    cancelText: "ยกเลิก",
    type: "warning",
    onConfirm: null,
    onCancel: null,
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title: options.title || "",
        message: options.message || "",
        confirmText: options.confirmText || "ยืนยัน",
        cancelText: options.cancelText || "ยกเลิก",
        type: options.type || "warning",
        onConfirm: () => {
          resolve(true);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        },
        onCancel: () => {
          resolve(false);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        },
      });
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    if (confirmState.onCancel) confirmState.onCancel();
  }, [confirmState.onCancel]);

  return (
    <ConfirmContext.Provider value={{ confirm, closeConfirm }}>
      {children}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
        onConfirm={confirmState.onConfirm}
        onCancel={confirmState.onCancel}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return context;
}