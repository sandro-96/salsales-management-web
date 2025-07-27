// File: src/utils/getDashboardComponent.js
import FnbAdminWeb from "../layouts/fnb/web/AdminDashboard";
import FnbCashierWeb from "../layouts/fnb/web/CashierDashboard";
import FnbStaffWeb from "../layouts/fnb/web/StaffDashboard";
import FnbCashierPos from "../layouts/fnb/pos/CashierDashboard";

import RetailManagerWeb from "../layouts/retail/web/ManagerDashboard";
import RetailCashierWeb from "../layouts/retail/web/CashierDashboard";
import RetailStaffWeb from "../layouts/retail/web/StaffDashboard";
import RetailCashierPos from "../layouts/retail/pos/CashierDashboard";

import PharmacyManagerWeb from "../layouts/pharmacy/web/ManagerDashboard";
import PharmacyCashierWeb from "../layouts/pharmacy/web/CashierDashboard";
import PharmacyCashierPos from "../layouts/pharmacy/pos/CashierDashboard";

import ServiceAdminWeb from "../layouts/service/web/AdminDashboard";
import ServiceStaffWeb from "../layouts/service/web/StaffDashboard";

import DefaultDashboard from "../layouts/DefaultDashboard";

/**
 * Trả về component layout dashboard theo industry + role + device
 * @param {string} industry - industry từ BE (vd: FNB, RETAIL...)
 * @param {string} role - vai trò tại chi nhánh (vd: ADMIN, MANAGER...)
 * @param {"web" | "pos"} device - loại thiết bị
 */
export function getDashboardComponent(industry, role, device = "web") {
  const key = `${industry}_${role}_${device}`.toUpperCase();

  const map = {
    // FNB
    "FNB_ADMIN_WEB": FnbAdminWeb,
    "FNB_OWNER_WEB": FnbAdminWeb, 
    "FNB_CASHIER_WEB": FnbCashierWeb,
    "FNB_CASHIER_POS": FnbCashierPos,
    "FNB_STAFF_WEB": FnbStaffWeb,

    // RETAIL
    "RETAIL_MANAGER_WEB": RetailManagerWeb,
    "RETAIL_OWNER_WEB": RetailManagerWeb,
    "RETAIL_CASHIER_WEB": RetailCashierWeb,
    "RETAIL_CASHIER_POS": RetailCashierPos,
    "RETAIL_STAFF_WEB": RetailStaffWeb,

    // PHARMACY
    "PHARMACY_MANAGER_WEB": PharmacyManagerWeb,
    "PHARMACY_OWNER_WEB": PharmacyManagerWeb,
    "PHARMACY_CASHIER_WEB": PharmacyCashierWeb,
    "PHARMACY_CASHIER_POS": PharmacyCashierPos,

    // SERVICE
    "SERVICE_ADMIN_WEB": ServiceAdminWeb,
    "SERVICE_OWNER_WEB": ServiceAdminWeb,
    "SERVICE_STAFF_WEB": ServiceStaffWeb,
  };

  return map[key] || DefaultDashboard;
}
