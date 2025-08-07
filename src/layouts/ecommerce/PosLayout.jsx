// src/layouts/ecommerce/PosLayout.jsx
import { Outlet } from "react-router-dom";

const EcommercePosLayout = ({ title }) => {
    return (
        <div className="min-h-screen bg-white">
            <header className="bg-green-800 text-white px-4 py-3 shadow-md">
                <h1 className="text-xl font-bold">{title}</h1>
            </header>

            <main className="p-4">
                <Outlet />
            </main>
        </div>
    );
};

export default EcommercePosLayout;
