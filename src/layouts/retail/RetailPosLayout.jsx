// src/layouts/retail/RetailPosLayout.jsx
import { Outlet } from "react-router-dom";
import { useShop } from "../../hooks/useShop";

const RetailPosLayout = ({ title }) => {
    const { selectedShop } = useShop();

    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Header */}
            <header className="bg-blue-800 text-white p-4 flex justify-between items-center shadow-md">
                <h1 className="text-xl font-bold">{title}</h1>
                <div>{selectedShop?.name}</div>
            </header>

            {/* Main POS screen */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left: Product list */}
                <section className="w-2/3 border-r p-4 overflow-y-auto">
                    <h2 className="text-lg font-semibold mb-2">Sản phẩm</h2>
                    {/* TODO: Product grid or category nav */}
                </section>

                {/* Right: Cart and actions */}
                <section className="w-1/3 p-4 bg-gray-100 overflow-y-auto">
                    <h2 className="text-lg font-semibold mb-2">Giỏ hàng</h2>
                    {/* TODO: Cart items and payment actions */}
                </section>
            </main>
        </div>
    );
};

export default RetailPosLayout;