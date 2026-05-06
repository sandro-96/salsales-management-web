// src/components/common/Alert.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Info, AlertTriangle, XCircle } from "lucide-react";

const alertStyles = {
  success:
    "bg-green-100 text-green-800 border-green-400 dark:bg-green-500/15 dark:text-green-200 dark:border-green-500/40",
  error:
    "bg-red-100 text-red-800 border-red-400 dark:bg-red-500/15 dark:text-red-200 dark:border-red-500/40",
  info: "bg-blue-100 text-blue-800 border-blue-400 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-500/40",
  warning:
    "bg-yellow-100 text-yellow-800 border-yellow-500 dark:bg-yellow-500/15 dark:text-yellow-200 dark:border-yellow-500/40",
};

const positionStyles = {
  "top-right": "top-4 right-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "top-left": "top-4 left-4",
};

const alertIcons = {
  success: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
  error: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
  info: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
};

const Alert = ({
  title,
  description,
  type = "info",
  actions = [],
  children,
  onClose,
  variant = "toast",
  position = "bottom-right",
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (variant === "modal" && e.key === "Escape") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [variant]);

  return (
    <AnimatePresence>
      {variant === "modal" ? (
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60"
        >
          <Motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-md p-6 border-l-4 ${alertStyles[type]}`}
          >
            <div className="flex items-center gap-2 mb-4">
              {alertIcons[type]}
              <h3 className="text-lg font-semibold">{title}</h3>
            </div>
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}
            {children && <div className="mt-4">{children}</div>}
            <div className="flex justify-end gap-2 mt-4">
              {actions.length > 0 ? (
                actions.map(({ label, onClick, to, className = "" }, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onClick?.();
                      if (to) navigate(to);
                      onClose();
                    }}
                    className={`px-4 py-2 rounded text-sm ${className}`}
                  >
                    {label}
                  </button>
                ))
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  Đóng
                </button>
              )}
            </div>
          </Motion.div>
        </Motion.div>
      ) : (
        <Motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className={`fixed ${positionStyles[position]} z-50 border px-4 py-3 rounded-lg shadow-md w-96 ${alertStyles[type]}`}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-2">
              {alertIcons[type]}
              <div>
                <div className="font-semibold">{title}</div>
                {description && (
                  <div className="text-sm opacity-90 mt-1">
                    {description}
                  </div>
                )}
                {children && <div className="mt-2">{children}</div>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-lg font-bold ml-2 leading-none"
            >
              &times;
            </button>
          </div>
          {actions.length > 0 && (
            <div className="mt-3 flex justify-end gap-2">
              {actions.map(({ label, onClick, to, className = "" }, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onClick?.();
                    if (to) navigate(to);
                    onClose();
                  }}
                  className={`text-sm px-3 py-1 rounded ${className}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </Motion.div>
      )}
    </AnimatePresence>
  );
};

export default Alert;
