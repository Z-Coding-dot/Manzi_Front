import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Check, ShieldCheck } from "lucide-react";
import { platformRoles, roleAreas } from "../../access";
import { useAdminSession } from "../../session";
import PageHeader from "../../components/PageHeader";
export default function Access() {
  const { t } = useTranslation();
  const { profile } = useAdminSession();
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("console.access")}
        description={t("adminConsole.accessDescription")}
        action={
          ["admin", "super_admin"].includes(profile?.role ?? "") ? (
            <Link
              to="/users"
              className="inline-flex min-h-11 items-center rounded-xl bg-forest px-4 text-sm font-medium text-white"
            >
              {t("adminConsole.manageRoles")}
            </Link>
          ) : undefined
        }
      />
      <section className="admin-panel flex items-start gap-3">
        <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-forest" />
        <div>
          <h3 className="text-base">{t("adminConsole.howRolesWork")}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {t("adminConsole.roleChangeHelp")}
          </p>
        </div>
      </section>
      <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {platformRoles.map((role) => (
          <section
            key={role}
            className={`admin-panel ${profile?.role === role ? "ring-2 ring-forest/25" : ""}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-base">{t(`admin.roles.${role}`)}</h3>
              {profile?.role === role && (
                <span className="rounded-full bg-forest-soft px-2.5 py-1 text-xs font-medium text-forest">
                  {t("adminConsole.yourRole")}
                </span>
              )}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {t(`adminConsole.roleSummary.${role}`)}
            </p>
            <h4 className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-muted">
              {t("adminConsole.availableAreas")}
            </h4>
            <ul className="space-y-2.5">
              {roleAreas[role].map((area) => (
                <li key={area} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-forest" />
                  {t(`adminConsole.areas.${area}`)}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className="admin-panel">
        <h3 className="text-base">{t("adminConsole.otherAccounts")}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t("adminConsole.otherAccountsHelp")}
        </p>
      </section>
    </div>
  );
}
