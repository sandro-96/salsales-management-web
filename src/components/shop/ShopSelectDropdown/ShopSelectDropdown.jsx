// src/components/shop/ShopSelectDropdown.jsx
import { useShop } from "../../hooks/useShop";
import "./ShopSelectDropdown.scss";

const ShopSelectDropdown = () => {
    const { shops, selectedShopId, setSelectedShopId } = useShop();

    if (shops.length === 0) {
        return <div className="shop-select__empty">Bạn chưa có cửa hàng nào</div>;
    }

    return (
        <div className="shop-select__wrapper">
            <label htmlFor="shop-select" className="shop-select__label">Cửa hàng</label>
            <select
                id="shop-select"
                value={selectedShopId || ""}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="shop-select__dropdown"
            >
                {shops.map(shop => (
                    <option key={shop.id} value={shop.id}>
                        {shop.name} ({shop.role})
                    </option>
                ))}
            </select>
        </div>
    );
};

export default ShopSelectDropdown;
