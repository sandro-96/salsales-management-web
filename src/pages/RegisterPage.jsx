import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { useWebSocket } from "../hooks/useWebSocket";
import { WebSocketMessageTypes } from "../constants/websocket";
import AuthPageLayout, {
  authInputClass,
  authPrimaryButtonClass,
} from "../components/auth/AuthPageLayout.jsx";
import { cn } from "@/lib/utils";

const RegisterPage = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    middleName: "",
    phone: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    middleName: "",
    phone: "",
    acceptTerms: "",
  });
  const [success, setSuccess] = useState("");
  const { subscribe, connected } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validateForm = () => {
    let tempErrors = {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      middleName: "",
      phone: "",
      acceptTerms: "",
    };
    let isValid = true;

    if (!acceptedTerms) {
      tempErrors.acceptTerms = t("auth.register.acceptTermsRequired");
      isValid = false;
    }

    const phoneCompact = form.phone.trim().replace(/\s+/g, "");
    const vnPhoneRegex = /^0(3|5|7|8|9)\d{8}$/;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email) {
      tempErrors.email = t("auth.register.errors.emailRequired");
      isValid = false;
    } else if (!emailRegex.test(form.email)) {
      tempErrors.email = t("auth.register.errors.emailInvalid");
      isValid = false;
    }

    if (!form.password) {
      tempErrors.password = t("auth.register.errors.passwordRequired");
      isValid = false;
    } else if (form.password.length < 6) {
      tempErrors.password = t("auth.register.errors.passwordMin");
      isValid = false;
    }

    if (!form.confirmPassword) {
      tempErrors.confirmPassword = t("auth.register.errors.confirmRequired");
      isValid = false;
    } else if (form.password !== form.confirmPassword) {
      tempErrors.confirmPassword = t("auth.register.errors.confirmMismatch");
      isValid = false;
    }

    if (!form.firstName) {
      tempErrors.firstName = t("auth.register.errors.firstNameRequired");
      isValid = false;
    } else if (form.firstName.length > 50) {
      tempErrors.firstName = t("auth.register.errors.firstNameMax");
      isValid = false;
    }

    if (!form.lastName) {
      tempErrors.lastName = t("auth.register.errors.lastNameRequired");
      isValid = false;
    } else if (form.lastName.length > 50) {
      tempErrors.lastName = t("auth.register.errors.lastNameMax");
      isValid = false;
    }

    if (form.middleName && form.middleName.length > 50) {
      tempErrors.middleName = t("auth.register.errors.middleNameMax");
      isValid = false;
    }

    if (!phoneCompact) {
      tempErrors.phone = t("auth.register.errors.phoneRequired");
      isValid = false;
    } else if (!vnPhoneRegex.test(phoneCompact)) {
      tempErrors.phone = t("auth.register.errors.phoneInvalid");
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const phoneCompact = form.phone.trim().replace(/\s+/g, "");

    try {
      setLoading(true);
      const response = await axiosInstance.post("/auth/register", {
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: form.middleName || null,
        phone: phoneCompact,
        countryCode: "VN",
      });
      if (response.data.success) {
        setSuccess(t("auth.register.successVerifyEmail"));
      }
    } catch (err) {
      const errorData = err.response?.data;
      let tempErrors = { ...errors };
      if (errorData && typeof errorData === "object") {
        if (errorData.errors) {
          Object.keys(errorData.errors).forEach((field) => {
            tempErrors[field] = errorData.errors[field];
          });
        } else {
          tempErrors.email =
            errorData.message || t("auth.register.errors.registerFailed");
        }
      } else {
        tempErrors.email =
          err.response?.data?.message ||
          t("auth.register.errors.registerFailed");
      }
      setErrors(tempErrors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!connected || !form.email) return;

    const unsubscribe = subscribe(`/topic/verify/${form.email}`, (message) => {
      if (message?.type === WebSocketMessageTypes.EMAIL_VERIFIED) {
        setSuccess(t("auth.register.successVerified"));
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [connected, form.email, navigate, subscribe, t]);

  const firstError = Object.values(errors).find(Boolean);

  return (
    <AuthPageLayout
      loading={loading}
      loadingText={t("auth.login.processing")}
      tagline={t("auth.layout.tagline")}
    >
      <header className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {t("auth.register.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("auth.register.alreadyHave")}{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            {t("auth.register.signIn")}
          </Link>
        </p>
      </header>

      {success ? (
        <p
          className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
          role="status"
        >
          {success}
        </p>
      ) : null}

      {firstError && !success ? (
        <p
          className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {firstError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-2">
          <label htmlFor="reg-email" className="text-sm font-medium">
            {t("auth.register.email")}
          </label>
          <input
            id="reg-email"
            type="email"
            name="email"
            autoComplete="email"
            className={cn(authInputClass, errors.email && "border-destructive")}
            value={form.email}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="reg-first" className="text-sm font-medium">
              {t("auth.register.firstName")}
            </label>
            <input
              id="reg-first"
              type="text"
              name="firstName"
              autoComplete="given-name"
              className={cn(
                authInputClass,
                errors.firstName && "border-destructive",
              )}
              value={form.firstName}
              onChange={handleChange}
              maxLength={50}
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="reg-last" className="text-sm font-medium">
              {t("auth.register.lastName")}
            </label>
            <input
              id="reg-last"
              type="text"
              name="lastName"
              autoComplete="family-name"
              className={cn(
                authInputClass,
                errors.lastName && "border-destructive",
              )}
              value={form.lastName}
              onChange={handleChange}
              maxLength={50}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="reg-phone" className="text-sm font-medium">
            {t("auth.register.phone")}
          </label>
          <input
            id="reg-phone"
            type="tel"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            className={cn(authInputClass, errors.phone && "border-destructive")}
            value={form.phone}
            onChange={handleChange}
            placeholder={t("auth.register.phonePlaceholder")}
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="reg-middle" className="text-sm font-medium">
            {t("auth.register.middleName")}
          </label>
          <input
            id="reg-middle"
            type="text"
            name="middleName"
            autoComplete="additional-name"
            className={cn(
              authInputClass,
              errors.middleName && "border-destructive",
            )}
            value={form.middleName}
            maxLength={50}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="reg-password" className="text-sm font-medium">
            {t("auth.register.password")}
          </label>
          <input
            id="reg-password"
            type="password"
            name="password"
            autoComplete="new-password"
            className={cn(
              authInputClass,
              errors.password && "border-destructive",
            )}
            value={form.password}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="reg-confirm" className="text-sm font-medium">
            {t("auth.register.confirmPassword")}
          </label>
          <input
            id="reg-confirm"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            className={cn(
              authInputClass,
              errors.confirmPassword && "border-destructive",
            )}
            value={form.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex items-start gap-3">
            <Checkbox
              id="reg-terms"
              checked={acceptedTerms}
              disabled={loading}
              onCheckedChange={(checked) => {
                setAcceptedTerms(checked === true);
                setErrors((prev) => ({ ...prev, acceptTerms: "" }));
              }}
              className="mt-0.5"
            />
            <label htmlFor="reg-terms" className="text-sm leading-relaxed cursor-pointer">
              <Trans
                i18nKey="auth.register.acceptTerms"
                components={{
                  terms: (
                    <Link
                      to="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    />
                  ),
                  privacy: (
                    <Link
                      to="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    />
                  ),
                }}
              />
            </label>
          </div>
          {errors.acceptTerms ? (
            <p className="text-sm text-destructive">{errors.acceptTerms}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={cn(authPrimaryButtonClass, "mt-2")}
        >
          {t("auth.register.submit")}
        </button>
      </form>
    </AuthPageLayout>
  );
};

export default RegisterPage;
