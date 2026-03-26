import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../hooks/useShop";
import {
  Store,
  Plus,
  MapPin,
  Phone,
  Building2,
  Briefcase,
  CheckCircle2,
  XCircle,
  Search,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getFlagUrl } from "../../utils/commonUtils";
import { COUNTRIES } from "../../constants/countries";

const PLAN_COLORS = {
  FREE: "bg-gray-100 text-gray-600 border-gray-200",
  BASIC: "bg-sky-100 text-sky-700 border-sky-200",
  PRO: "bg-violet-100 text-violet-700 border-violet-200",
  ENTERPRISE: "bg-amber-100 text-amber-700 border-amber-200",
};

const ShopPage = () => {
  const { shops, setSelectedShop } = useShop();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");

  const filteredShops = useMemo(() => {
    if (!keyword.trim()) return shops;
    const kw = keyword.toLowerCase();
    return shops.filter(
      (s) =>
        s.name?.toLowerCase().includes(kw) ||
        s.address?.toLowerCase().includes(kw),
    );
  }, [shops, keyword]);

  const handleShopSelect = (shop) => {
    setSelectedShop(shop);
    navigate(shop.slug);
  };

  if (shops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full p-8">
        <div className="max-w-md">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <Store className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            Chào mừng bạn!
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Bạn chưa có cửa hàng nào. Hãy bắt đầu bằng cách tạo cửa hàng đầu
            tiên để quản lý chi nhánh, sản phẩm và đơn hàng.
          </p>
          <Button onClick={() => navigate("/shops/create")}>
            <Plus className="h-4 w-4 mr-1" /> Tạo cửa hàng đầu tiên
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex-1 flex-col gap-6 p-4 md:p-8 md:flex">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Cửa hàng của tôi</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {shops.length} cửa hàng
            </p>
          </div>
          <Button onClick={() => navigate("create")} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Tạo cửa hàng
          </Button>
        </div>

        {shops.length > 4 && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Tìm cửa hàng..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Shop grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredShops.map((shop) => {
            const country = COUNTRIES.find((c) => c.code === shop.countryCode);
            const planCls = PLAN_COLORS[shop.plan] || PLAN_COLORS.FREE;

            return (
              <Card
                key={shop.id}
                className="group relative py-0 gap-0 transition-all cursor-pointer hover:shadow-md"
                onClick={() => handleShopSelect(shop)}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4">
                    {/* Top: Logo + Name + Status */}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 rounded-xl border shrink-0">
                        <AvatarImage src={shop.logoUrl} alt={shop.name} className="object-cover" />
                        <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                          <Store className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{shop.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">
                          {shop.type?.toLowerCase().replace(/_/g, " ") || "—"}
                        </p>
                      </div>
                      {shop.active ? (
                        <Badge className="shrink-0 text-[10px] gap-0.5 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Hoạt động
                        </Badge>
                      ) : (
                        <Badge className="shrink-0 text-[10px] gap-0.5 bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100">
                          <XCircle className="h-2.5 w-2.5" /> Tạm ngưng
                        </Badge>
                      )}
                    </div>

                    {/* Info rows */}
                    <div className="flex flex-col gap-1.5">
                      {shop.address && (
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                          <span className="truncate">{shop.address}</span>
                        </span>
                      )}
                      {shop.phone && (
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                          {country ? `${country.dialCode} ` : ""}{shop.phone}
                        </span>
                      )}
                      {shop.industry && (
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                          {shop.industry}
                        </span>
                      )}
                      {shop.businessModel && (
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                          {shop.businessModel}
                        </span>
                      )}
                    </div>

                    {/* Footer: Country + Plan + Role */}
                    <div className="flex items-center gap-2 pt-2 border-t flex-wrap">
                      {country && (
                        <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 font-normal">
                          <img
                            src={getFlagUrl(shop.countryCode)}
                            alt={shop.countryCode}
                            className="h-3 w-auto rounded-sm"
                          />
                          {country.name}
                        </Badge>
                      )}
                      {shop.plan && (
                        <Badge className={`text-[10px] px-1.5 py-0 font-normal ${planCls}`}>
                          <Crown className="h-2.5 w-2.5 mr-0.5" /> {shop.plan}
                        </Badge>
                      )}
                      {shop.role && (
                        <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 font-normal">
                          {shop.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredShops.length === 0 && keyword && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Store className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Không tìm thấy cửa hàng phù hợp.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
