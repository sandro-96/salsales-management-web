import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MainPage = () => {
  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center bg-muted/40 px-4 py-10 dark:bg-muted/15">
      <Card className="w-full max-w-md border shadow-sm">
        <CardHeader>
          <CardTitle className="text-center text-xl">Trang chủ</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Chọn mục từ menu để bắt đầu làm việc.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MainPage;
