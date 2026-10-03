import { useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Eye, RefreshCw } from "lucide-react";
import { httpClient } from "@/api/httpClient";
import { providerApi } from "@/services/providerApi";
import { Button } from "@/components/ui/Button";
import { useAdminSession } from "../../session";
import ResponsiveTable from "../../components/ResponsiveTable";
interface Stats {
  total: number;
  month: number;
  today: number;
  pages: { path: string; views: number }[];
  daily: { day: string; views: number }[];
}
const api = providerApi.injectEndpoints({
  endpoints: (builder) => ({
    consoleViews: builder.query<Stats, void>({
      queryFn: async () => {
        try {
          return { data: (await httpClient.get<Stats>("/admin/views")).data };
        } catch {
          return { error: { status: "CUSTOM_ERROR", data: "Request failed" } };
        }
      },
    }),
  }),
});
export default function Views() {
  const { t, i18n } = useTranslation();
  const systemReducedMotion = useReducedMotion();
  const { preferences } = useAdminSession();
  const { data, isLoading, isError, refetch } = api.useConsoleViewsQuery(
    undefined,
    { pollingInterval: preferences.refreshInterval * 1000 },
  );
  const series = useMemo(() => {
    if (!data) return [];
    const totals = new Map(data.daily.map((row) => [row.day, row.views]));
    const today = new Date(Date.now() + 270 * 60000).toISOString().slice(0, 10);
    return Array.from({ length: 30 }, (_, i) => {
      const day = new Date(
        new Date(`${today}T00:00:00Z`).getTime() - (29 - i) * 86400000,
      )
        .toISOString()
        .slice(0, 10);
      return { day, views: totals.get(day) ?? 0 };
    });
  }, [data]);
  const dateLabel = (day: string) =>
    new Date(`${day}T00:00:00Z`).toLocaleDateString(i18n.language, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-forest" />
            {t("console.views")}
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            {t("console.viewsHelp")}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => void refetch()}
          aria-label={t("adminConsole.refreshViews")}
        >
          <RefreshCw className="h-4 w-4" />
          {t("adminConsole.refresh")}
        </Button>
      </div>
      {isError && (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft p-4 text-sm text-danger"
        >
          {t("admin.loadError")}
        </p>
      )}
      {isLoading && <p role="status">{t("common.loading")}</p>}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {(["total", "month", "today"] as const).map((key, i) => (
              <div key={key} className="admin-panel">
                <p className="text-sm text-muted">
                  {t(
                    `console.${["totalViews", "monthViews", "todayViews"][i]}`,
                  )}
                </p>
                <p className="mt-4 text-3xl font-semibold text-ink">
                  {data[key].toLocaleString(i18n.language)}
                </p>
              </div>
            ))}
          </div>
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <h3>{t("adminConsole.viewTrend")}</h3>
              <p>{t("adminConsole.viewTrendHelp")}</p>
            </div>
            <div
              className="h-64 min-w-0 sm:h-72"
              role="img"
              aria-label={t("adminConsole.viewChart")}
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart
                  data={series}
                  margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="views-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#0d5a48"
                        stopOpacity={0.24}
                      />
                      <stop
                        offset="100%"
                        stopColor="#0d5a48"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="#e2e5e0"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    tickFormatter={dateLabel}
                    minTickGap={36}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      Number(v).toLocaleString(i18n.language)
                    }
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    labelFormatter={(value) => dateLabel(String(value))}
                    formatter={(value) => [
                      Number(value).toLocaleString(i18n.language),
                      t("console.count"),
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#0d5a48"
                    strokeWidth={2.5}
                    fill="url(#views-fill)"
                    isAnimationActive={
                      !preferences.reducedMotion && !systemReducedMotion
                    }
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <details className="mt-4 text-sm">
              <summary className="min-h-11 cursor-pointer py-3 text-forest">
                {t("adminConsole.dailyData")}
              </summary>
              <div className="max-h-80 overflow-auto">
                <ResponsiveTable
                  label={t("adminConsole.dailyData")}
                  headings={[t("adminConsole.date"), t("console.count")]}
                >
                  {series.map((row) => (
                    <tr key={row.day}>
                      <td>{dateLabel(row.day)}</td>
                      <td>{row.views.toLocaleString(i18n.language)}</td>
                    </tr>
                  ))}
                </ResponsiveTable>
              </div>
            </details>
          </section>
          <div>
            <h3 className="mb-4 text-base">{t("adminConsole.topPages")}</h3>
            {data.pages.length ? (
              <ResponsiveTable
                label={t("adminConsole.topPages")}
                headings={[t("console.path"), t("console.count")]}
              >
                {data.pages.map((page) => (
                  <tr key={page.path}>
                    <td>
                      <span
                        dir="ltr"
                        className="inline-block break-all font-mono text-xs"
                      >
                        {page.path}
                      </span>
                    </td>
                    <td>{page.views.toLocaleString(i18n.language)}</td>
                  </tr>
                ))}
              </ResponsiveTable>
            ) : (
              <div className="admin-panel text-sm text-muted">
                {t("common.noResults")}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
