// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardLayout from "./layouts/DashboardLayout";
import ProductListPage from "./pages/products/ProductListPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import GuestOnlyRoute from "./routes/GuestOnlyRoute";
import RoleBasedRoute from "./routes/RoleBasedRoute";
import AdminPage from "./pages/admin/AdminPage"; // 👈 tạo sau nếu chưa có

function App() {
    return (
        <Routes>
            {/* 🟡 Guest-only pages (nếu đã login thì redirect) */}
            <Route
                path="/login"
                element={
                    <GuestOnlyRoute>
                        <LoginPage />
                    </GuestOnlyRoute>
                }
            />
            <Route
                path="/register"
                element={
                    <GuestOnlyRoute>
                        <RegisterPage />
                    </GuestOnlyRoute>
                }
            />

            {/* 🟡 Không cần login */}
            <Route path="/verify" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* 🔐 ADMIN area */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute>
                        <RoleBasedRoute allowedRoles={["ROLE_ADMIN"]}>
                            <AdminPage />
                        </RoleBasedRoute>
                    </ProtectedRoute>
                }
            />

            {/* 🔐 User area (shop roles: OWNER, STAFF, CASHIER) */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <RoleBasedRoute allowedRoles={["ROLE_USER"]}>
                            <DashboardLayout />
                        </RoleBasedRoute>
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="products" />} />
                <Route path="products" element={<ProductListPage />} />
                {/* Add more nested routes here */}
            </Route>
        </Routes>
    );
}

export default App;
