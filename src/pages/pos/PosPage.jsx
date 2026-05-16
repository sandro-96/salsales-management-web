import { useTranslation } from "react-i18next";
import { Store } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

import { usePosPage } from "./usePosPage";
import { PosPageShell } from "./PosPageShell";

export default function PosPage() {
  const { t } = useTranslation();
  const ctx = usePosPage();

  if (!ctx.effectiveBranchId) {
    return (
      <div className="flex h-full items-center justify-center p-6 bg-muted/20">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Store className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">
                {t("pages.pos.branchPrompt.title")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("pages.pos.branchPrompt.subtitle")}
              </p>
            </div>
            {ctx.branches.length > 0 ? (
              <Select value="" onValueChange={ctx.setSelectedBranchId}>
                <SelectTrigger className="w-full max-w-[280px] mx-auto">
                  <SelectValue
                    placeholder={t("pages.pos.branchPrompt.selectPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {ctx.branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t("pages.pos.branchPrompt.noBranches")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <PosPageShell {...ctx} />;
}
