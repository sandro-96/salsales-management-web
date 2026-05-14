// src/pages/NotFoundPage.jsx
import { useTranslation } from "react-i18next";

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-background px-4 text-center text-foreground">
      <h1 className="text-5xl font-bold text-gray-800 dark:text-foreground mb-4">
        {t("error.notFound.code")}
      </h1>
      <p className="text-xl text-gray-600 dark:text-muted-foreground mb-6">
        {t("error.notFound.message")}
      </p>
      <a
        href="/"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition dark:bg-blue-500 dark:hover:bg-blue-400"
      >
        {t("error.notFound.back")}
      </a>
    </div>
  );
};

export default NotFoundPage;
