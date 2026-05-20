import { useTranslation } from "react-i18next";
import { Store } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { usePosPage } from "./usePosPage";
import { PosPageShell } from "./PosPageShell";

export default function PosPage() {
  const { t } = useTranslation();
  const ctx = usePosPage();

  if (!ctx.effectiveBranchId) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/20 p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-3 border-b pb-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Store className="h-7 w-7 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {t("pages.pos.branchPrompt.title")}
              </CardTitle>
              <CardDescription className="mt-1.5 text-sm">
                {t("pages.pos.branchPrompt.subtitle")}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 pb-8">
            {ctx.branches.length > 0 ? (
              <div className="mx-auto w-full max-w-[280px] space-y-2 text-left">
                <Label htmlFor="pos-branch-select" className="text-xs">
                  {t("pages.pos.branchPrompt.selectLabel")}
                </Label>
                <Select value="" onValueChange={ctx.setSelectedBranchId}>
                  <SelectTrigger id="pos-branch-select" className="w-full">
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
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
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
