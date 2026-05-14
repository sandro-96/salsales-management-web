import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const HistoryPage = () => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center bg-muted/40 px-4 py-10 dark:bg-muted/15">
      <Card className="w-full max-w-md border shadow-sm">
        <CardHeader>
          <CardTitle className="text-center text-xl">
            {t("history.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            {t("history.description")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryPage;
