import { useNavigate } from "react-router-dom";
import { FaStore, FaEdit } from "react-icons/fa";
import { useShop } from "../../hooks/useShop";
import { Store } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { Badge } from "@/components/ui/badge";
import { getFlagUrl } from "../../utils/commonUtils";
import { COUNTRIES } from "../../constants/countries";

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
    navigate(shop.slug);
  };

  return (
    <div className="p-6 h-full w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div className="font-medium text-2xl text-center sm:text-left">
          Danh sách cửa hàng
        </div>
        <Button
          onClick={() => navigate("create")}
          variant="success"
          className="w-fit self-center sm:self-auto"
        >
          <Store className="mr-1" />
          Tạo cửa hàng mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {
          /* Shops list by Cards */
          shops.map((shop) => (
            <Card
              key={shop.id}
              className="bg-gradient-to-r from-sky-100 via-sky-50 flex flex-col gap-4 rounded-lg shadow-md border hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleShopSelect(shop)}
            >
              <CardHeader>
                <Item className="bg-secondary/10 text-secondary border-0 px-2 py-1 rounded w-fit">
                  <ItemMedia>
                    <Avatar className="size-10 rounded-lg">
                      <AvatarImage
                        src={`${import.meta.env.VITE_API_BASE_URL.replace(
                          "/api",
                          ""
                        )}${shop.logoUrl}`}
                        alt="Shop Logo"
                        className="size-full object-cover"
                      />
                      <AvatarFallback>
                        <Store className="size-8 text-gray-400" />
                      </AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="text-lg font-semibold line-clamp-1">
                      {shop.name}
                    </ItemTitle>
                    <ItemDescription className="text-sm text-muted-foreground capitalize">
                      {shop.type.toLowerCase()}
                    </ItemDescription>
                  </ItemContent>
                </Item>
                <ItemSeparator />
              </CardHeader>

              <CardContent className="grow-1">
                <Item className="bg-secondary/10 text-secondary border-0 px-2 py-1 rounded w-fit">
                  <ItemContent>
                    <ItemTitle>Address</ItemTitle>
                    <ItemDescription>
                      {shop.address || "Chưa cập nhật"}
                    </ItemDescription>
                  </ItemContent>
                </Item>
                <Item className="bg-secondary/10 text-secondary border-0 px-2 py-1 rounded w-fit">
                  <ItemContent>
                    <ItemTitle>Phone</ItemTitle>
                    <ItemDescription>
                      {COUNTRIES.find((c) => c.code === shop.countryCode)
                        ? `${
                            COUNTRIES.find((c) => c.code === shop.countryCode)
                              .dialCode
                          } `
                        : ""}
                      {shop.phone || "Chưa cập nhật"}
                    </ItemDescription>
                  </ItemContent>
                </Item>
                <Item className="bg-secondary/10 text-secondary border-0 px-2 py-1 rounded w-fit">
                  <ItemContent>
                    <ItemTitle>Industry</ItemTitle>
                    <ItemDescription>
                      {shop.industry || "Chưa cập nhật"}
                    </ItemDescription>
                  </ItemContent>
                </Item>
                <Item className="bg-secondary/10 text-secondary border-0 px-2 py-1 rounded w-fit">
                  <ItemContent>
                    <ItemTitle>Business Model</ItemTitle>
                    <ItemDescription>
                      {shop.businessModel || "Chưa cập nhật"}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </CardContent>
              <ItemSeparator />
              <CardFooter>
                <Badge variant="secondary">
                  {shop.countryCode ? (
                    <img
                      src={getFlagUrl(shop.countryCode)}
                      alt={shop.countryCode}
                      className="inline-block size-4 rounded-sm"
                    />
                  ) : null}
                  {COUNTRIES.find((c) => c.code === shop.countryCode)?.name}
                </Badge>
                <Badge
                  variant={shop.active ? "secondary" : "destructive"}
                  className={`ml-auto ${
                    shop.active ? "bg-green-100 text-green-700" : ""
                  }`}
                >
                  {shop.active ? "Active" : "Inactive"}
                </Badge>
              </CardFooter>
            </Card>
          ))
        }
      </div>
    </div>
  );
};

export default ShopPage;
