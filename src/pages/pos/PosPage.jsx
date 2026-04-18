import React from "react";
import { UtensilsCrossed } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { usePosPage } from "./usePosPage";
import { PosPageShell } from "./PosPageShell";

export default function PosPage() {
  const ctx = usePosPage();

  if (!ctx.effectiveBranchId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-lg font-medium">Vui lòng chọn chi nhánh</p>
          <p className="text-sm text-muted-foreground">
            Chọn chi nhánh từ thanh tiêu đề để bắt đầu bán hàng
          </p>
          {ctx.branches.length > 0 && (
            <Select value="" onValueChange={ctx.setSelectedBranchId}>
              <SelectTrigger className="w-[240px] mx-auto">
                <SelectValue placeholder="Chọn chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                {ctx.branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    );
  }

  return <PosPageShell {...ctx} />;
}
