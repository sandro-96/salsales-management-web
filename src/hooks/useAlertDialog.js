import { useContext } from "react";
import { AlertDialogContext } from "../contexts/AlertDialogContext.js";
export const useAlertDialog = () => {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error(
      "useAlertDialog must be used within an AlertDialogProvider"
    );
  }
  return context;
};
