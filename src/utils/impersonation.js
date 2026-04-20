// src/utils/impersonation.js
// Helpers to switch the current accessToken between the admin and an
// impersonated user, keeping the admin token in sessionStorage so we can
// restore it when admin clicks "Thoát giả danh".
import { jwtDecode } from "jwt-decode";
import { startImpersonation } from "@/api/adminApi";

const ORIGINAL_TOKEN_KEY = "impersonationOriginalAccessToken";
const ORIGINAL_REFRESH_KEY = "impersonationOriginalRefreshToken";

export function getCurrentImpersonation() {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    const decoded = jwtDecode(token);
    if (!decoded?.impersonatedBy) return null;
    return {
      impersonatedBy: decoded.impersonatedBy,
      impersonatorEmail: decoded.impersonatorEmail,
      targetUserId: decoded.sub,
      targetEmail: decoded.email,
    };
  } catch {
    return null;
  }
}

export async function startImpersonationFlow(userId) {
  const res = await startImpersonation(userId);
  const payload = res.data?.data;
  if (!payload?.accessToken) throw new Error("Missing impersonation token");

  const origAccess = localStorage.getItem("accessToken");
  const origRefresh = localStorage.getItem("refreshToken");
  if (origAccess) sessionStorage.setItem(ORIGINAL_TOKEN_KEY, origAccess);
  if (origRefresh) sessionStorage.setItem(ORIGINAL_REFRESH_KEY, origRefresh);

  localStorage.setItem("accessToken", payload.accessToken);
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("selectedShopId");
  localStorage.removeItem("selectedBranchId");
  return payload;
}

export function stopImpersonation() {
  const origAccess = sessionStorage.getItem(ORIGINAL_TOKEN_KEY);
  const origRefresh = sessionStorage.getItem(ORIGINAL_REFRESH_KEY);
  if (origAccess) localStorage.setItem("accessToken", origAccess);
  else localStorage.removeItem("accessToken");
  if (origRefresh) localStorage.setItem("refreshToken", origRefresh);
  sessionStorage.removeItem(ORIGINAL_TOKEN_KEY);
  sessionStorage.removeItem(ORIGINAL_REFRESH_KEY);
  localStorage.removeItem("selectedShopId");
  localStorage.removeItem("selectedBranchId");
}

export function hasOriginalAdminToken() {
  return !!sessionStorage.getItem(ORIGINAL_TOKEN_KEY);
}
