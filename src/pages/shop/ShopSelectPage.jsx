// src/pages/shop/ShopSelectPage.jsx
import { useShop } from "../../hooks/useShop";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const ShopSelectPage = () => {
    const { shops, setSelectedShopId } = useShop();
    const navigate = useNavigate();

    useEffect(() => {
        if (shops.length === 0) {
            navigate("/create-shop");
        } else if (shops.length === 1) {
            setSelectedShopId(shops[0].id);
            navigate("/overview");
        }
    }, [shops, setSelectedShopId, navigate]);

    const handleSelect = (id) => {
        setSelectedShopId(id);
        navigate("/overview");
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
            <div className="bg-white p-8 rounded-lg shadow w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4 text-center">Chọn cửa hàng</h2>
                {shops.length === 0 ? (
                    <p className="text-gray-600 text-center">Bạn chưa tham gia cửa hàng nào.</p>
                ) : (
                    <ul className="space-y-4">
                        {shops.map(shop => (
                            <li
                                key={shop.id}
                                className="border rounded p-4 hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleSelect(shop.id)}
                            >
                                <p className="font-medium">{shop.name}</p>
                                <p className="text-sm text-gray-500">Vai trò: {shop.role}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ShopSelectPage;
