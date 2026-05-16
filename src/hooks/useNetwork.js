import { useContext } from "react";
import { NetworkContext } from "../contexts/NetworkContext.js";

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) {
    throw new Error("useNetwork must be used within NetworkProvider");
  }
  return ctx;
}
