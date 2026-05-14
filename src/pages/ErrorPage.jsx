import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ErrorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const error = location.state?.error || {
    status: t("error.generic.title"),
    message: t("error.generic.message"),
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-background text-foreground">
      <div className="bg-card text-card-foreground p-8 rounded-lg shadow-lg text-center max-w-md border">
        <h1 className="text-4xl font-bold text-red-600 dark:text-red-400 mb-4">
          {error.status || t("error.generic.title")}
        </h1>
        <p className="text-muted-foreground mb-6">
          {error.message || t("error.generic.message")}
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-300 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          {t("error.generic.back")}
        </button>
      </div>
    </div>
  );
};

export default ErrorPage;
