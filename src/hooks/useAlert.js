import { useContext } from "react";
import AlertContext from "../contexts/AlertContext.js";
export const useAlert = () => useContext(AlertContext);
