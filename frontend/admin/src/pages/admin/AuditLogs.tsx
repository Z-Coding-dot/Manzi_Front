import PageHeader from "../../components/PageHeader";
import ResponsiveTable from "../../components/ResponsiveTable";
import { useAdminSession } from "../../session";
import { useState } from "react";
import { Filter, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { providerApi } from "@/services/providerApi";
import { httpClient } from "@/api/httpClient";

interface Log {
  id: string;
  createdAt: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: { name: string } | null;
  metadata: unknown;
}

const api = providerApi.injectEndpoints({
  endpoints: (builder) => ({
    adminLogs: builder.query<
      Log[],
      { entityType?: string; from?: string; to?: string; cursor?: string }
    >({
      queryFn: async (params) => {
        try {
          return {
            data: (await httpClient.get<Log[]>("/admin/audit-logs", { params }))
              .data,
          };
        } catch {
          return { error: { status: "CUSTOM_ERROR", data: "Request failed" } };
        }
      },
    }),
  }),
  overrideExisting: false,
});

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  create: { bg: "var(--color-forest-soft)", text: "var(--color-forest)" },
  update: { bg: "var(--color-info-soft)", text: "var(--color-info)" },
  delete: { bg: "var(--color-danger-soft)", text: "var(--color-danger)" },
  approve: { bg: "var(--color-forest-soft)", text: "var(--color-forest)" },
  reject: { bg: "var(--color-danger-soft)", text: "var(--color-danger)" },
  login: { bg: "var(--color-sand-soft)", text: "var(--color-sand)" },
};

export default function AuditLogs() {
  const { t } = useTranslation();
  const { formatDate, preferences } = useAdminSession();
  const [entityType, setEntity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filters, setFilters] = useState<{
    entityType?: string;
    from?: string;
    to?: string;
    cursor?: string;
  }>({});

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = api.useAdminLogsQuery(filters, {
    pollingInterval: preferences.refreshInterval * 1000,
  });

  function applyFilters() {
    setFilters({
      entityType: entityType || undefined,
      from: from || undefined,
      to: to ? `${to}T23:59:59.999Z` : undefined,
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("admin.audit")}
        description={t("adminConsole.auditDescription")}
      />

      {/* Filters */}
      <form
        className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-4 rounded-lg border border-line bg-surface p-4"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters();
        }}
      >
        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted">
            {t("admin.entity")}
          </label>
          <input
            value={entityType}
            onChange={(e) => setEntity(e.target.value)}
            placeholder={t("adminConsole.entityPlaceholder")}
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-forest"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted">
            {t("admin.from")}
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-forest"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-muted">
            {t("admin.to")}
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-forest"
          />
        </div>
        <Button type="submit">
          <Filter className="h-4 w-4 mr-1.5" />
          {t("admin.filter")}
        </Button>
      </form>

      {isError ? (
        <Card>
          <CardBody className="py-8 text-center space-y-3">
            <p className="text-sm text-muted">{t("admin.loadError")}</p>
            <Button variant="secondary" onClick={() => void refetch()}>
              <RefreshCw className="h-4 w-4 mr-1.5" /> {t("admin.retry")}
            </Button>
          </CardBody>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-line/40 animate-pulse" />
          ))}
        </div>
      ) : !data.length ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm text-muted">{t("common.noResults")}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-line bg-surface">
            <ResponsiveTable
              label={t("admin.audit")}
              headings={[
                t("adminConsole.when"),
                t("adminConsole.actor"),
                t("adminConsole.action"),
                t("admin.entity"),
                t("adminConsole.entityId"),
                t("adminConsole.details"),
              ]}
            >
              {data.map((log) => {
                const actionColor = ACTION_COLORS[log.action.toLowerCase()] ?? {
                  bg: "var(--color-sand-soft)",
                  text: "var(--color-sand)",
                };
                return (
                  <tr
                    key={log.id}
                    className="border-b border-line last:border-0 hover:bg-paper transition-colors"
                  >
                    <td className="px-5 py-3.5 tabular text-body text-xs">
                      {formatDate(log.createdAt, true)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-ink">
                      {log.actor?.name ?? (
                        <span className="text-muted">{t("admin.system")}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize"
                        style={{
                          background: actionColor.bg,
                          color: actionColor.text,
                        }}
                      >
                        {t(`adminConsole.auditActions.${log.action}`, {
                          defaultValue: log.action,
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-body capitalize">
                      {t(`adminConsole.entities.${log.entityType}`, {
                        defaultValue: log.entityType,
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted">
                      {log.entityId.slice(0, 10)}…
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      {log.metadata != null && (
                        <pre className="overflow-x-auto text-xs text-muted max-h-12">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </td>
                  </tr>
                );
              })}
            </ResponsiveTable>
          </div>
          {data.length === 100 && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={() =>
                  setFilters({ ...filters, cursor: data.at(-1)!.id })
                }
              >
                {t("admin.next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
