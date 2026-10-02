import { saveSession } from "@/api/session";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { httpClient } from "@/api/httpClient";
import { useAppDispatch } from "@/redux/hooks";
import { loginSuccess, type AuthUser } from "@/redux/slices/authSlice";
import { getDirection } from "@/i18n/config";

export default function Login() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const values = new FormData(e.currentTarget);
    try {
      const { data } = await httpClient.post<{
        user: AuthUser;
        accessToken: string;
        refreshToken: string;
      }>("/auth/login", {
        email: values.get("email"),
        password: values.get("password"),
      });
      if (!["admin", "super_admin"].includes(data.user.role)) {
        await httpClient.post("/auth/logout", {
          refreshToken: data.refreshToken,
        });
        setError(t("admin.accessDenied"));
        return;
      }
      saveSession(data.accessToken, data.refreshToken, rememberMe);
      dispatch(loginSuccess({ ...data.user, propertyName: "" }));
      navigate("/");
    } catch {
      setError(t("admin.loginError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir={getDirection(i18n.language)}
      className="grid min-h-screen bg-paper lg:grid-cols-2"
    >
      <section className="relative hidden flex-col justify-between overflow-hidden bg-forest p-12 lg:flex">
        <div
          aria-hidden="true"
          className="absolute -end-32 -top-32 h-[32rem] w-[32rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-48 -start-20 h-[36rem] w-[36rem] rounded-full bg-forest-deep/40"
        />
        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-xl font-semibold text-white">
            M
          </span>
          <span className="text-xl font-semibold text-white">
            {t("app.name")}
          </span>
        </div>
        <div className="relative max-w-lg space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/80">
            <Shield className="h-4 w-4" />
            {t("admin.console")}
          </span>
          <h2 className="text-5xl font-semibold leading-tight tracking-tight text-white">
            {t("admin.loginHeading")}
          </h2>
          <p className="max-w-sm text-base leading-relaxed text-white/70">
            {t("admin.loginDescription")}
          </p>
        </div>
        <p className="relative text-xs text-white/50">
          Manzil / {new Date().getFullYear()}
        </p>
      </section>
      <section className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-4 px-6 py-6 sm:px-10">
          <div className="flex items-center gap-2 text-sm font-semibold text-forest">
            <Shield className="h-5 w-5" />
            {t("admin.console")}
          </div>
          <LanguageSwitcher />
        </header>
        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm"
          >
            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-forest/10 bg-forest-soft text-forest">
                <Shield className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-ink">
                {t("auth.welcomeBack")}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t("admin.loginSubtitle")}
              </p>
            </div>
            <form onSubmit={(e) => void submit(e)} className="space-y-5">
              <Field
                label={t("admin.email")}
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                required
              />
              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-1.5 block text-sm font-medium text-body"
                >
                  {t("auth.password")}
                </label>
                <PasswordInput
                  id="admin-password"
                  name="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-body">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-line accent-forest"
                />
                {t("auth.rememberMe")}
              </label>
              {error && (
                <p
                  role="alert"
                  className="rounded-md border border-danger/20 bg-danger-soft p-3 text-sm text-danger"
                >
                  {error}
                </p>
              )}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? t("common.loading") : t("auth.signIn")}
              </Button>
            </form>
            <p className="mt-6 text-center text-xs text-muted">
              {t("admin.loginRestricted")}
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
