import { useNavigate } from "react-router-dom";
import { FaStore, FaEdit } from "react-icons/fa";
import { useShop } from "../../hooks/useShop";
import { Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ShopPage = () => {
  const { shops, setSelectedShop } = useShop();
  const navigate = useNavigate();

  if (shops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full">
        <Card className="w-full max-w-md p-8 shadow-lg border border-border/50">
          <CardContent className="flex flex-col items-center gap-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <Store className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold mb-2">
                Chào mừng bạn đến với hệ thống quản lý cửa hàng
              </h2>
              <p className="text-muted-foreground text-sm">
                Bạn chưa có cửa hàng nào. Hãy bắt đầu bằng cách tạo cửa hàng đầu
                tiên để quản lý chi nhánh, sản phẩm và đơn hàng.
              </p>
            </div>
            <Button
              onClick={() => navigate("/shops/create")}
              className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700"
            >
              + Tạo cửa hàng đầu tiên
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleShopSelect = (shop) => {
    setSelectedShop(shop);
    navigate(shop.id);
  };

  return (
    <div className="p-6 h-full w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="font-medium text-2xl">Danh sách cửa hàng</div>
        <Button
          onClick={() => navigate("create")}
          variant="info"
          className="w-fit"
        >
          <Store />
          Tạo cửa hàng mới
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map((shop) => (
          <div
            key={shop.id}
            className="flex flex-col gap-4 p-6 rounded-lg shadow-md"
            onClick={() => handleShopSelect(shop)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="size-12 rounded-lg border-b-blue-700 border-2">
                {shop.logoUrl ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL.replace(
                      "/api",
                      ""
                    )}${shop.logoUrl}`}
                    alt="Shop Logo"
                    className="size-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="rounded-lg">
                    <Store className="size-8 text-gray-400" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{shop.name}</h3>
                <p className="text-sm text-gray-500">{shop.type}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm">
                <strong>Địa chỉ:</strong> {shop.address || "Chưa cập nhật"}
              </p>
              <p className="text-sm">
                <strong>SĐT:</strong> {shop.phone || "Chưa cập nhật"}
              </p>
              <p className="text-sm">
                <strong>Ngành hàng:</strong> {shop.industry || "Chưa cập nhật"}
              </p>
              <p className="text-sm">
                <strong>Mô hình:</strong>{" "}
                {shop.businessModel || "Chưa cập nhật"}
              </p>
            </div>
            <div className="flex justify-between">
              <span
                className={`text-sm px-2 py-1 rounded ${
                  shop.active
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {shop.active ? "Hoạt động" : "Không hoạt động"}
              </span>
              <button
                onClick={() => navigate(`/shops/${shop.id}`)}
                className="text-blue-500 hover:text-blue-700 flex items-center"
              >
                <FaEdit className="mr-1" /> Chỉnh sửa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShopPage;
