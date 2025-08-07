// src/layouts/healthcare/PosLayout.jsx
import { Outlet } from "react-router-dom";

const HealthcarePosLayout = ({ title }) => {
    return (
        <div className="min-h-screen bg-white">
            <header className="bg-blue-900 text-white px-4 py-3 shadow-md">
                <h1 className="text-xl font-bold">{title}</h1>
            </header>

            <main className="p-4">
                <Outlet />
            </main>
        </div>
    );
};

export default HealthcarePosLayout;
