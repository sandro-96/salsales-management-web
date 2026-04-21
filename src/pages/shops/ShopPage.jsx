import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShop } from "../../hooks/useShop";
import { useAuth } from "../../hooks/useAuth";
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
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getFlagUrl } from "../../utils/commonUtils";
import { COUNTRIES } from "../../constants/countries";
import { SHOP_INDUSTRY } from "../../constants/ShopIndustry.js";
import { SHOP_ROLE_LABELS } from "../../constants/shopRoles.js";
import { SUBSCRIPTION_STATUS_LABELS } from "../../constants/subscriptionStatus.js";

const INDUSTRY_LABELS = {
  [SHOP_INDUSTRY.FNB]: "Nhà hàng / F&B",
  [SHOP_INDUSTRY.RETAIL]: "Bán lẻ",
  [SHOP_INDUSTRY.HEALTHCARE]: "Y tế / dược",
  [SHOP_INDUSTRY.SERVICE]: "Dịch vụ",
  [SHOP_INDUSTRY.EDUCATION]: "Giáo dục",
  [SHOP_INDUSTRY.OTHER]: "Khác",
};

function pickOptionLabel(options, value) {
  if (!value || !Array.isArray(options)) return null;
  const hit = options.find((o) => o.value === value);
  return hit?.label || null;
}

const ShopPage = () => {
  const { shops, setSelectedShop } = useShop();
  const { enums, fetchEnums } = useAuth();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    if (!enums && typeof fetchEnums === "function") fetchEnums();
  }, [enums, fetchEnums]);

  const shopTypes = enums?.shopTypes || [];
  const businessModels = enums?.businessModels || [];

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
            const typeLabel =
              pickOptionLabel(shopTypes, shop.type) ||
              (shop.type ? String(shop.type).replace(/_/g, " ") : null);
            const bizLabel =
              pickOptionLabel(businessModels, shop.businessModel) ||
              (shop.businessModel
                ? String(shop.businessModel).replace(/_/g, " ")
                : null);
            const industryLabel =
              (shop.industry && INDUSTRY_LABELS[shop.industry]) || shop.industry;
            const roleLabel =
              (shop.role && SHOP_ROLE_LABELS[shop.role]) || shop.role;

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
                        {typeLabel && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {typeLabel}
                          </p>
                        )}
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
                      {industryLabel && (
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                          {industryLabel}
                        </span>
                      )}
                      {bizLabel && (
                        <span className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                          {bizLabel}
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
                      {/* Gói dịch vụ: truy cập chi tiết qua /billing khi shop được chọn */}
                      {roleLabel && (
                        <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 font-normal">
                          {roleLabel}
                        </Badge>
                      )}
                    </div>

                    {shop.subscriptionStatus != null && (
                      <div className="flex items-start gap-2 text-xs pt-2 border-t text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground/70" />
                        <span>
                          <span className="font-medium text-foreground">
                            {SUBSCRIPTION_STATUS_LABELS[shop.subscriptionStatus] ||
                              shop.subscriptionStatus}
                          </span>
                          {(shop.subscriptionStatus === "TRIAL" ||
                            shop.subscriptionStatus === "ACTIVE") && (
                            <>
                              {" "}
                              · Còn{" "}
                              <span className="tabular-nums font-medium text-foreground">
                                {shop.subscriptionDaysRemaining ?? 0}
                              </span>{" "}
                              ngày
                            </>
                          )}
                        </span>
                      </div>
                    )}
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
