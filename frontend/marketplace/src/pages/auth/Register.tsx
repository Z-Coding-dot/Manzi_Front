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
import { SelectField } from "@/components/ui/SelectField";
import { LANGUAGES } from "@/i18n/config";
import { useAppDispatch } from "@/redux/hooks";
import { loginSuccess } from "@/redux/slices/authSlice";

export default function Register() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const language = i18n.language.replace("-", "_");
      const response = await httpClient.post<{
        user: {
          id: string;
          name: string;
          email: string | null;
          language: string;
        };
        accessToken: string;
        refreshToken: string;
      }>("/auth/register", {
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        password: form.get("password"),
        language,
      });
      saveSession(response.data.accessToken, response.data.refreshToken, true);
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
      setError(
        "Unable to create your account. Check the details and try again.",
      );
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
        <h2 className="text-2xl text-ink">{t("auth.createAccountTitle")}</h2>
        <p className="mt-1 text-sm text-muted">
          {t("auth.createAccountSubtitle")}
        </p>

        <div className="mt-6">
          <Field name="name" label={t("auth.fullName")} required />
        </div>
        <div className="mt-4">
          <Field name="email" label={t("auth.email")} type="email" required />
        </div>
        <div className="mt-4">
          <Field
            name="phone"
            label={t("auth.phone")}
            type="tel"
            placeholder="+93 7X XXX XXXX"
            required
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <SelectField label={t("auth.country")} defaultValue="Afghanistan">
            <option>Afghanistan</option>
            <option>Other</option>
          </SelectField>
          <SelectField
            label={t("auth.preferredLanguage")}
            defaultValue={i18n.language}
          >
            {Object.entries(LANGUAGES).map(([code, meta]) => (
              <option key={code} value={code}>
                {meta.nativeLabel}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="mt-4">
          <PasswordInput name="password" label={t("auth.password")} required />
        </div>

        <Button type="submit" className="mt-6 w-full" disabled={loading}>
          {loading ? t("common.loading") : t("auth.createAccount")}
        </Button>
        {error && <p className="mt-4 text-sm text-danger">{error}</p>}

        <p className="mt-6 text-center text-sm text-muted">
          {t("auth.haveAccount")}{" "}
          <Link to="/login" className="font-medium text-forest hover:underline">
            {t("auth.signInLink")}
          </Link>
        </p>
      </motion.form>
    </AuthLayout>
  );
}
