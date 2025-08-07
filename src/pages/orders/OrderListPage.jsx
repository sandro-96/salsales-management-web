import React from "react";
import {useShop} from "../../hooks/useShop.js";
import {SHOP_INDUSTRY} from "../../constants/ShopIndustry.js";

const OrderListPage = () => {
    const { selectedIndustry, selectedRole } = useShop();
    const getIndustrySpecificContent = () => {
        switch (selectedIndustry) {
            case SHOP_INDUSTRY.FNB:
                return <div>Order list for FNB with specific FNB logic</div>;
            case SHOP_INDUSTRY.RETAIL:
                return <div>Order list for RETAIL with specific RETAIL logic</div>;
            case SHOP_INDUSTRY.HEALTHCARE:
                return <div>Order list for HEALTHCARE with specific HEALTHCARE logic</div>;
            case SHOP_INDUSTRY.SERVICE:
                return <div>Order list for SERVICE with specific SERVICE logic</div>;
            case SHOP_INDUSTRY.EDUCATION:
                return <div>Order list for EDUCATION with specific EDUCATION logic</div>;
            case SHOP_INDUSTRY.OTHER:
                return <div>Order list for OTHER with specific OTHER logic</div>;
            default:
                return <div>Order list for all industries with general logic</div>;
        }
    };

    return (
        <div>
            <h1>Order List - {selectedIndustry} - {selectedRole}</h1>
            {getIndustrySpecificContent()}
        </div>
    );
};

export default OrderListPage;