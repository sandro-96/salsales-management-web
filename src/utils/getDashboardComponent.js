// File: src/utils/getDashboardComponent.js

// === FNB ===
import FnbAdminWeb from "../layouts/fnb/web/AdminDashboard";
import FnbStaffWeb from "../layouts/fnb/web/StaffDashboard";
import FnbAdminPos from "../layouts/fnb/pos/CashierDashboard"; // tạm dùng chung cho OWNER, MANAGER, ADMIN
import FnbStaffPos from "../layouts/fnb/pos/StaffDashboard";

// === RETAIL ===
import RetailManagerWeb from "../layouts/retail/web/ManagerDashboard";
import RetailStaffWeb from "../layouts/retail/web/StaffDashboard";
import RetailManagerPos from "../layouts/retail/pos/CashierDashboard"; // tạm dùng chung cho OWNER, MANAGER
import RetailStaffPos from "../layouts/retail/pos/CashierDashboard"; // dùng chung

// === PHARMACY ===
import PharmacyManagerWeb from "../layouts/pharmacy/web/ManagerDashboard";
import PharmacyManagerPos from "../layouts/pharmacy/pos/CashierDashboard"; // tạm dùng chung
import PharmacyStaffWeb from "../layouts/pharmacy/web/CashierDashboard"; // tạm dùng layout Cashier cho STAFF
import PharmacyStaffPos from "../layouts/pharmacy/pos/CashierDashboard";

// === SERVICE ===
import ServiceAdminWeb from "../layouts/service/web/AdminDashboard";
import ServiceStaffWeb from "../layouts/service/web/StaffDashboard";

// === DEFAULT ===
import DefaultDashboard from "../layouts/DefaultDashboard";

/**
 * Trả về component layout dashboard theo industry + role + device
 * @param {string} industry - industry từ BE (vd: FNB, RETAIL...)
 * @param {string} role - vai trò tại chi nhánh (OWNER, MANAGER, ADMIN, STAFF)
 * @param {"web" | "pos"} device - loại thiết bị
 */
export function getDashboardComponent(industry, role, device = "web") {
  const key = `${industry}_${role}_${device}`.toUpperCase();

  const map = {
    // ==== FNB ====
    "FNB_OWNER_WEB": FnbAdminWeb,
    "FNB_MANAGER_WEB": FnbAdminWeb,
    "FNB_ADMIN_WEB": FnbAdminWeb,
    "FNB_STAFF_WEB": FnbStaffWeb,
    "FNB_OWNER_POS": FnbAdminPos,
    "FNB_MANAGER_POS": FnbAdminPos,
    "FNB_ADMIN_POS": FnbAdminPos,
    "FNB_STAFF_POS": FnbStaffPos,

    // ==== RETAIL ====
    "RETAIL_OWNER_WEB": RetailManagerWeb,
    "RETAIL_MANAGER_WEB": RetailManagerWeb,
    "RETAIL_ADMIN_WEB": RetailManagerWeb, // nếu cần riêng thì import thêm
    "RETAIL_STAFF_WEB": RetailStaffWeb,
    "RETAIL_OWNER_POS": RetailManagerPos,
    "RETAIL_MANAGER_POS": RetailManagerPos,
    "RETAIL_ADMIN_POS": RetailManagerPos,
    "RETAIL_STAFF_POS": RetailStaffPos,

    // ==== PHARMACY ====
    "PHARMACY_OWNER_WEB": PharmacyManagerWeb,
    "PHARMACY_MANAGER_WEB": PharmacyManagerWeb,
    "PHARMACY_ADMIN_WEB": PharmacyManagerWeb,
    "PHARMACY_STAFF_WEB": PharmacyStaffWeb,
    "PHARMACY_OWNER_POS": PharmacyManagerPos,
    "PHARMACY_MANAGER_POS": PharmacyManagerPos,
    "PHARMACY_ADMIN_POS": PharmacyManagerPos,
    "PHARMACY_STAFF_POS": PharmacyStaffPos,

    // ==== SERVICE ====
    "SERVICE_OWNER_WEB": ServiceAdminWeb,
    "SERVICE_MANAGER_WEB": ServiceAdminWeb,
    "SERVICE_ADMIN_WEB": ServiceAdminWeb,
    "SERVICE_STAFF_WEB": ServiceStaffWeb,
  };

  return map[key] || DefaultDashboard;
}
