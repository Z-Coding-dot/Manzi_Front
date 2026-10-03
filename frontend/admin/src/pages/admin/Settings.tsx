import Content from "./Content";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Globe2, SlidersHorizontal, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { httpClient } from "@/api/httpClient";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/SelectField";
import { LANGUAGES } from "@/i18n/config";
import { useAdminSession, type Preferences, type Profile } from "../../session";
import PageHeader from "../../components/PageHeader";
export default function Settings() {
  const { t, i18n } = useTranslation();
  const { profile, preferences, update } = useAdminSession();
  const [values, setValues] = useState<Preferences>(preferences);
  const [language, setLanguage] = useState(profile?.language ?? "en");
  const [currency, setCurrency] = useState(profile?.currency ?? "AFN");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  function change<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const { data } = await httpClient.patch<Profile>(
        "/users/me/preferences",
        { ...values, language, currency },
      );
      update(data);
      await i18n.changeLanguage(data.language.replace("_", "-"));
      setFailed(false);
      setMessage(t("admin.saved"));
    } catch {
      setFailed(true);
      setMessage(t("admin.saveError"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("console.settings")}
        description={t("adminConsole.settingsDescription")}
      />
      {message && (
        <p
          role={failed ? "alert" : "status"}
          className={`rounded-xl p-4 text-sm ${failed ? "bg-danger-soft text-danger" : "bg-forest-soft text-forest"}`}
        >
          {message}
        </p>
      )}
      <form onSubmit={save} className="space-y-6">
        <div className="grid items-start gap-6 xl:grid-cols-2">
          <section className="admin-panel space-y-5">
            <div className="admin-panel-heading">
              <h3 className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-forest" />
                {t("adminConsole.regional")}
              </h3>
              <p>{t("adminConsole.regionalHelp")}</p>
            </div>
            <SelectField
              id="settings-language"
              label={t("console.language")}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {Object.entries(LANGUAGES).map(([key, meta]) => (
                <option key={key} value={key.replace("-", "_")}>
                  {meta.nativeLabel}
                </option>
              ))}
            </SelectField>
            <SelectField
              id="settings-currency"
              label={t("console.currency")}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="AFN">AFN</option>
              <option value="USD">USD</option>
            </SelectField>
            <SelectField
              id="settings-timezone"
              label={t("adminConsole.timeZone")}
              value={values.timeZone}
              onChange={(e) =>
                change("timeZone", e.target.value as Preferences["timeZone"])
              }
            >
              <option value="Asia/Kabul">{t("adminConsole.kabulTime")}</option>
              <option value="UTC">UTC</option>
            </SelectField>
            <SelectField
              id="settings-date"
              label={t("adminConsole.dateFormat")}
              value={values.dateFormat}
              onChange={(e) =>
                change(
                  "dateFormat",
                  e.target.value as Preferences["dateFormat"],
                )
              }
            >
              <option value="locale">{t("adminConsole.localizedDate")}</option>
              <option value="iso">YYYY-MM-DD</option>
            </SelectField>
          </section>
          <section className="admin-panel space-y-5">
            <div className="admin-panel-heading">
              <h3 className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-forest" />
                {t("adminConsole.workspace")}
              </h3>
              <p>{t("adminConsole.workspaceHelp")}</p>
            </div>
            <SelectField
              id="settings-density"
              label={t("adminConsole.tableDensity")}
              value={values.density}
              onChange={(e) =>
                change("density", e.target.value as Preferences["density"])
              }
            >
              <option value="comfortable">
                {t("adminConsole.comfortable")}
              </option>
              <option value="compact">{t("adminConsole.compact")}</option>
            </SelectField>
            <SelectField
              id="settings-refresh"
              label={t("adminConsole.autoRefresh")}
              value={values.refreshInterval}
              onChange={(e) =>
                change("refreshInterval", Number(e.target.value))
              }
            >
              {[0, 30, 60, 120].map((value) => (
                <option key={value} value={value}>
                  {value === 0
                    ? t("adminConsole.manualOnly")
                    : t("adminConsole.seconds", { count: value })}
                </option>
              ))}
            </SelectField>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-4">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 accent-forest"
                checked={values.reducedMotion}
                onChange={(e) => change("reducedMotion", e.target.checked)}
              />
              <span>
                <span className="block text-sm font-semibold">
                  {t("adminConsole.reducedMotion")}
                </span>
                <span className="mt-2 block text-sm leading-relaxed text-muted">
                  {t("adminConsole.motionHelp")}
                </span>
              </span>
            </label>
          </section>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button disabled={busy}>
            {t(busy ? "common.loading" : "common.save")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => {
              setValues(preferences);
              setLanguage(profile?.language ?? "en");
              setCurrency(profile?.currency ?? "AFN");
              setMessage("");
            }}
          >
            {t("adminConsole.discardChanges")}
          </Button>
        </div>
      </form>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h3 className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-forest" />
            {t("adminConsole.security")}
          </h3>
          <p>{t("adminConsole.securityHelp")}</p>
        </div>
        <Link
          to="/profile"
          className="inline-flex min-h-11 items-center rounded-xl bg-forest-soft px-4 text-sm font-medium text-forest"
        >
          {t("adminConsole.manageSecurity")}
        </Link>
      </section>
      {profile?.role === "super_admin" && (
        <details className="admin-panel">
          <summary className="cursor-pointer py-2 text-base font-semibold text-ink">
            {t("adminConsole.platformSettings")}
          </summary>
          <div className="mt-5">
            <Content platform />
          </div>
        </details>
      )}
    </div>
  );
}
