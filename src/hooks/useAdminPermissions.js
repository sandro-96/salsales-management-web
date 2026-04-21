// src/hooks/useAdminPermissions.js
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { getAdminPermissions } from "../api/adminApi.js";

/**
 * Cache lần đầu gọi /api/admin/me/permissions để mọi nơi chia sẻ.
 * Đơn giản: in-memory; token thay đổi sẽ reset.
 */
let _cache = { token: null, perms: null, loading: false, waiters: [] };

function onTokenChange(token) {
  if (_cache.token !== token) {
    _cache = { token, perms: null, loading: false, waiters: [] };
  }
}

async function fetchOnce() {
  if (_cache.perms) return _cache.perms;
  if (_cache.loading) {
    return new Promise((resolve) => _cache.waiters.push(resolve));
  }
  _cache.loading = true;
  try {
    const res = await getAdminPermissions();
    const perms = new Set(res?.data?.data?.permissions || []);
    _cache.perms = perms;
    _cache.waiters.forEach((w) => w(perms));
    _cache.waiters = [];
    return perms;
  } finally {
    _cache.loading = false;
  }
}

/**
 * Trả về tiện ích kiểm tra AdminPermission cho user hiện tại.
 * Chỉ fetch khi role === ROLE_ADMIN; với role khác trả về empty set.
 */
export function useAdminPermissions() {
  const { user } = useAuth();
  const isAdmin =
    typeof user?.role === "string"
      ? user.role.includes("ROLE_ADMIN")
      : Array.isArray(user?.role)
        ? user.role.includes("ROLE_ADMIN")
        : false;
  const [perms, setPerms] = useState(() => _cache.perms || new Set());
  const [loading, setLoading] = useState(isAdmin && !_cache.perms);

  const refresh = useCallback(async () => {
    if (!isAdmin) {
      setPerms(new Set());
      return new Set();
    }
    setLoading(true);
    _cache.perms = null;
    try {
      const next = await fetchOnce();
      setPerms(next);
      return next;
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? (localStorage.getItem("accessToken") ?? localStorage.getItem("token"))
        : null;
    onTokenChange(token);
    if (!isAdmin) {
      setPerms(new Set());
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const next = await fetchOnce();
      if (!cancelled) {
        setPerms(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, user?.id]);

  const hasAdminPermission = useCallback(
    (perm) => perms.has(perm),
    [perms],
  );
  const hasAnyAdminPermission = useCallback(
    (list = []) => list.some((p) => perms.has(p)),
    [perms],
  );
  const hasAllAdminPermissions = useCallback(
    (list = []) => list.every((p) => perms.has(p)),
    [perms],
  );

  return {
    adminPermissions: perms,
    loading,
    hasAdminPermission,
    hasAnyAdminPermission,
    hasAllAdminPermissions,
    refresh,
  };
}
