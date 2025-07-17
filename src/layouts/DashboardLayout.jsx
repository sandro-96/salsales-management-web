// src/layouts/DashboardLayout.jsx
import { Outlet, Link } from "react-router-dom";

const DashboardLayout = () => {
    return (
        <div className="flex h-screen">
            <aside className="w-64 bg-gray-800 text-white p-4">
                <h2 className="text-xl font-bold mb-4">Sales Manager</h2>
                <nav>
                    <ul className="space-y-2">
                        <li><Link to="/products">Sản phẩm</Link></li>
                        {/* Add more links */}
                    </ul>
                </nav>
            </aside>
            <main className="flex-1 p-6 bg-gray-100 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};
export default DashboardLayout;