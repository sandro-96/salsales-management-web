// src/hooks/useDevice.js
const isPosDevice = () => {
  return window.location.hostname.startsWith("pos.") || window.location.pathname.startsWith("/pos");
};

export const useDevice = () => {
  return isPosDevice() ? "pos" : "web";
};
