import React, { useState, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertDialogContext } from "./AlertDialogContext.js";
import { Button } from "@/components/ui/button.jsx";

const AlertDialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "OK",
    cancelText: "Cancel",
    onConfirm: null,
    onCancel: null,
    type: "alert", // "alert" | "confirm",
    variant: "default",
  });

  const showAlert = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        open: true,
        type: "alert",
        title: options.title || "Thông báo",
        message,
        confirmText: options.confirmText || "OK",
        onConfirm: () => {
          resolve(true);
          setDialog((d) => ({ ...d, open: false }));
        },
      });
    });
  }, []);

  const showConfirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        open: true,
        type: "confirm",
        title: options.title || "Xác nhận",
        message,
        confirmText: options.confirmText || "Đồng ý",
        cancelText: options.cancelText || "Hủy",
        variant: options.variant || "default",
        onConfirm: () => {
          resolve(true);
          setDialog((d) => ({ ...d, open: false }));
        },
        onCancel: () => {
          resolve(false);
          setDialog((d) => ({ ...d, open: false }));
        },
      });
    });
  }, []);

  return (
    <AlertDialogContext.Provider
      value={{ alert: showAlert, confirm: showConfirm }}
    >
      {children}

      {/* Component AlertDialog thực tế */}
      <AlertDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialog.message}</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            {dialog.type === "confirm" && (
              <AlertDialogCancel onClick={dialog.onCancel}>
                {dialog.cancelText}
              </AlertDialogCancel>
            )}
            <Button
              variant={dialog.variant || "default"}
              onClick={dialog.onConfirm}
            >
              {dialog.confirmText}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertDialogContext.Provider>
  );
};
export default AlertDialogProvider;
