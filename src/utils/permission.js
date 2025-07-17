// src/utils/permission.js
export const checkPermission = (role, allowedRoles) => {
    if (!role) return false;
    return allowedRoles.includes(role);
};
