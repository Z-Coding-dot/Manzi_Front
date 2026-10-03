import { useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Building2,
  CalendarCheck,
  Users,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { httpClient } from "@/api/httpClient";
import { providerApi } from "@/services/providerApi";
import { Button } from "@/components/ui/Button";
import { useAdminSession } from "../../session";
import PageHeader from "../../components/PageHeader";
import Views from "./Views";
interface Stats {
  totalProperties: number;
  publishedProperties: number;
  activeReservations: number;
  newUsers: number;
  pendingProperties: number;
  flaggedReviews: number;
  openTickets: number;
  pendingPayouts: number;
  gmv: { currency: string; amount: number }[];
}
const api = providerApi.injectEndpoints({
  endpoints: (builder) => ({
    consoleStats: builder.query<Stats, void>({
      queryFn: async () => {
        try {
          return { data: (await httpClient.get<Stats>("/admin/stats")).data };
        } catch {
          return { error: { status: "CUSTOM_ERROR", data: "Request failed" } };
        }
      },
    }),
  }),
});
const colors = ["#0d5a48", "#c98a2c", "#2c6e8c", "#8b5e83"];
export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const systemReducedMotion = useReducedMotion();
  const { preferences, profile } = useAdminSession();
  const { data, isLoading, isError, refetch } = api.useConsoleStatsQuery(
    undefined,
    { pollingInterval: preferences.refreshInterval * 1000 },
  );
  const tasks = data
    ? [
        {
          name: t("admin.pendingProperties"),
          value: data.pendingProperties,
          to: "/properties",
        },
        {
          name: t("admin.pendingReviews"),
          value: data.flaggedReviews,
          to: "/reviews",
        },
        { name: t("admin.tickets"), value: data.openTickets, to: "/support" },
        {
          name: t("admin.payouts"),
          value: data.pendingPayouts,
          to: "/payouts",
        },
      ]
    : [];
  return (
    <div className="space-y-7">
      <PageHeader
        title={t("admin.title")}
        description={t("admin.subtitle")}
        action={
          <Button variant="secondary" onClick={() => void refetch()}>
            <RefreshCw className="h-4 w-4" />
            {t("adminConsole.refresh")}
          </Button>
        }
      />
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-line/40"
            />
          ))}
        </div>
      ) : isError || !data ? (
        <div className="admin-panel">
          <p role="alert">{t("admin.loadError")}</p>
          <Button onClick={() => void refetch()}>{t("admin.retry")}</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "admin.properties",
                value: data.totalProperties,
                icon: Building2,
              },
              {
                label: "admin.published",
                value: data.publishedProperties,
                icon: Building2,
              },
              {
                label: "admin.reservations",
                value: data.activeReservations,
                icon: CalendarCheck,
              },
              { label: "admin.newUsers", value: data.newUsers, icon: Users },
            ].map(({ label, value, icon: Icon }) => (
              <section key={label} className="admin-panel">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted">{t(label)}</p>
                  <Icon className="h-5 w-5 shrink-0 text-forest" />
                </div>
                <p className="mt-4 text-3xl font-semibold text-ink">
                  {value.toLocaleString(i18n.language)}
                </p>
              </section>
            ))}
          </div>
          <div className="grid items-stretch gap-5 xl:grid-cols-2">
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <h3>{t("admin.attention")}</h3>
                <p>{t("adminConsole.attentionHelp")}</p>
              </div>
              <div className="grid items-center gap-5 sm:grid-cols-2">
                <div
                  className="h-52 min-w-0"
                  role="img"
                  aria-label={t("adminConsole.queueChart")}
                >
                  {tasks.some((task) => task.value > 0) ? (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minWidth={0}
                    >
                      <PieChart>
                        <Pie
                          data={tasks}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={52}
                          outerRadius={80}
                          paddingAngle={4}
                          isAnimationActive={
                            !preferences.reducedMotion && !systemReducedMotion
                          }
                        >
                          {tasks.map((task, i) => (
                            <Cell key={task.to} fill={colors[i]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) =>
                            Number(value).toLocaleString(i18n.language)
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-xl bg-forest-soft text-sm text-forest">
                      {t("adminConsole.allCaughtUp")}
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {tasks.map((task, i) => (
                    <Link
                      key={task.to}
                      to={task.to}
                      className="flex min-h-11 items-center justify-between gap-3 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: colors[i] }}
                        />
                        {task.name}
                      </span>
                      <strong className="text-ink">
                        {task.value.toLocaleString(i18n.language)}
                      </strong>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <h3 className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-forest" />
                  {t("admin.revenue")}
                </h3>
                <p>{t("adminConsole.revenueHelp")}</p>
              </div>
              {data.gmv.length ? (
                <div className="space-y-4">
                  {[...data.gmv]
                    .sort(
                      (a, b) =>
                        Number(b.currency === profile?.currency) -
                        Number(a.currency === profile?.currency),
                    )
                    .map((row) => (
                      <div
                        key={row.currency}
                        className="rounded-xl bg-paper p-5"
                      >
                        <p className="text-xs text-muted">{row.currency}</p>
                        <p className="mt-3 break-words text-2xl font-semibold text-ink">
                          {new Intl.NumberFormat(i18n.language, {
                            style: "currency",
                            currency: row.currency,
                            maximumFractionDigits: 0,
                          }).format(row.amount)}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted">{t("admin.noPayments")}</p>
              )}
            </section>
          </div>
        </>
      )}
      <Views />
    </div>
  );
}
