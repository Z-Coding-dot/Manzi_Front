import { saveSession } from '@/api/session';
import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { httpClient } from "@/api/httpClient";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAppDispatch } from "@/redux/hooks";
import { loginSuccess } from "@/redux/slices/authSlice";

export default function Login() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");


  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const response = await httpClient.post<{
        user: {
          id: string;
          name: string;
          email: string | null;
          language: string;
        };
        accessToken: string;
        refreshToken: string;
      }>("/auth/login", {
        email: form.get("email"),
        password: form.get("password"),
      });
      saveSession(response.data.accessToken, response.data.refreshToken, rememberMe);
      dispatch(
        loginSuccess({
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email ?? "",
          language: response.data.user.language,
        }),
      );
      navigate("/account");
    } catch {
      setError(t("auth.loginError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl">{t("auth.welcomeBack")}</h2>
        <p className="mt-1 text-sm text-muted">{t("auth.loginSubtitle")}</p>

        <div className="mt-6">
          <Field name="email" label={t("auth.email")} type="email" required />
        </div>
        <div className="mt-4">
          <PasswordInput name="password" label={t("auth.password")} required />
        </div>
        <div className="mt-2 text-end">
          <Link
            to="/forgot-password"
            className="text-xs text-forest hover:underline"
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-body cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-line accent-forest"
          />
          {t("auth.rememberMe")}
        </label>

        <Button type="submit" className="mt-6 w-full" disabled={loading}>
          {loading ? t("common.loading") : t("auth.signIn")}
        </Button>
        {error && <p className="mt-4 text-sm text-danger">{error}</p>}


        <p className="mt-6 text-center text-sm text-muted">
          {t("auth.noAccount")}{" "}
          <Link
            to="/register"
            className="font-medium text-forest hover:underline"
          >
            {t("auth.signUpLink")}
          </Link>
        </p>
      </motion.form>
    </AuthLayout>
  );
}
