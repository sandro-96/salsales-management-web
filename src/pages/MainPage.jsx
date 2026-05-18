import { Navigate } from "react-router-dom";
import { useShop } from "@/hooks/useShop";
import Loading from "@/components/loading/Loading.jsx";
import { OnboardingZeroShop } from "@/components/onboarding/OnboardingZeroShop.jsx";

const MainPage = () => {
  const { shops, isShopContextReady } = useShop();

  if (!isShopContextReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (shops.length > 0) {
    return <Navigate to="/shops" replace />;
  }

  return (
    <div className="flex min-h-full w-full flex-col bg-muted/40 dark:bg-muted/15">
      <OnboardingZeroShop />
    </div>
  );
};

export default MainPage;
