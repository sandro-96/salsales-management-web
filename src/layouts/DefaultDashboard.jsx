import { useTranslation } from "react-i18next";

const DefaultDashboard = () => {
  const { t } = useTranslation();
  return (
    <section className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-2">
        {t("dashboard.default.welcome", { brand: t("brand.appName") })}
      </h1>
      <p className="text-muted-foreground">
        {t("dashboard.default.notConfigured")}
      </p>
    </section>
  );
};

export default DefaultDashboard;
