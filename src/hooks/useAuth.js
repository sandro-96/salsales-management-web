// src/hooks/useAuth.js
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext.js";

export const useAuth = () => useContext(AuthContext);
