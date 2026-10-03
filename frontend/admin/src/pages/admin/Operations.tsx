import PageHeader from "../../components/PageHeader";
import { useAdminSession } from "../../session";
import { useState } from "react";
import { CheckCircle, Search, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { providerApi } from "@/services/providerApi";
import { httpClient } from "@/api/httpClient";

type Area = "reservations" | "payouts" | "reviews" | "support";
interface Row {
  id: string;
  status: string;
  property?: { name: string };
  customer?: { name: string };
  total?: number;
  amount?: number;
  currency?: string;
  comment?: string;
  overallRating?: number;
  subject?: string;
  body?: string;
  response?: string;
  checkIn?: string;
  checkOut?: string;
}

const paths: Record<Area, string> = {
  reservations: "/reservations",
  payouts: "/payouts",
  reviews: "/admin/reviews",
  support: "/support-tickets",
};

const api = providerApi.injectEndpoints({
  endpoints: (builder) => ({
    adminOperations: builder.query<Row[], Area>({
      queryFn: async (area) => {
        try {
          return { data: (await httpClient.get<Row[]>(paths[area])).data };
        } catch {
          return { error: { status: "CUSTOM_ERROR", data: "Request failed" } };
        }
      },
      providesTags: ["Reservation"],
    }),
    adminOperation: builder.mutation<
      Row,
      { area: Area; id: string; action: string; response?: string }
    >({
      queryFn: async ({ area, id, action, response }) => {
        try {
          return {
            data: (
              await httpClient.request<Row>({
                url: `${paths[area]}/${id}${area === "payouts" || area === "reservations" ? `/${action}` : ""}`,
                method:
                  area === "payouts" || area === "reservations"
                    ? "POST"
                    : "PATCH",
                data:
                  area === "payouts" || area === "reservations"
                    ? undefined
                    : { status: action, ...(response ? { response } : {}) },
              })
            ).data,
          };
        } catch {
          return { error: { status: "CUSTOM_ERROR", data: "Request failed" } };
        }
      },
      invalidatesTags: ["Reservation"],
    }),
  }),
  overrideExisting: false,
});

const STATUS_TONE: Record<
  string,
  "success" | "warning" | "danger" | "neutral"
> = {
  confirmed: "success",
  approved: "success",
  published: "success",
  resolved: "success",
  closed: "neutral",
  pending: "warning",
  investigating: "warning",
  waiting: "warning",
  cancelled: "danger",
  rejected: "danger",
  hidden: "danger",
  flagged: "danger",
};

const AREA_ACTIONS: Record<Area, string[]> = {
  payouts: ["approve", "reject"],
  reviews: ["published", "hidden", "flagged"],
  support: ["investigating", "waiting", "resolved", "closed"],
  reservations: ["check-in", "check-out", "cancel"],
};

const AREA_LABEL: Record<Area, string> = {
  reservations: "admin.reservations",
  payouts: "admin.payouts",
  reviews: "admin.reviews",
  support: "admin.support",
};

export default function Operations({ area }: { area: Area }) {
  const { t, i18n } = useTranslation();
  const { preferences, formatDate } = useAdminSession();
  const [search, setSearch] = useState("");
  const [response, setResponse] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = api.useAdminOperationsQuery(area, {
    pollingInterval: preferences.refreshInterval * 1000,
  });
  const [act, { isLoading: saving }] = api.useAdminOperationMutation();

  async function change(id: string, action: string) {
    if (
      area === "reservations" &&
      !confirm(
        t("adminConsole.reservationConfirm", {
          action: t(`adminConsole.actionLabels.${action}`),
        }),
      )
    )
      return;
    setError("");
    setSuccess("");
    try {
      await act({ area, id, action, response: response[id] }).unwrap();
      setSuccess(t("admin.saved"));
    } catch {
      setError(t("admin.saveError"));
    }
  }

  const rows = data.filter((row) =>
    [
      row.id,
      row.property?.name,
      row.customer?.name,
      row.subject,
      row.status,
    ].some((v) => v?.toLowerCase().includes(search.toLowerCase())),
  );

  const actions = AREA_ACTIONS[area];
  function rowActions(row: Row) {
    if (area !== "reservations") return actions;
    if (row.status === "confirmed") return ["check-in", "cancel"];
    if (row.status === "checked_in") return ["check-out"];
    return ["draft", "pending", "payment_pending"].includes(row.status)
      ? ["cancel"]
      : [];
  }
  const showActions = (row: Row) =>
    area === "payouts" ? row.status === "pending" : actions.length > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t(AREA_LABEL[area])}
        description={t(`adminConsole.operationsDescription.${area}`)}
      />

      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 max-w-md">
        <Search className="h-4 w-4 text-muted shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.search")}
          className="w-full min-w-0 flex-1 bg-transparent text-sm outline-none text-ink placeholder:text-muted"
        />
      </div>

      {/* Alerts */}
      {(error || isError) && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-2 rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          <XCircle className="h-4 w-4 shrink-0" />
          {error || t("admin.loadError")}
          <button
            onClick={() => void refetch()}
            className="ml-auto underline text-xs"
          >
            {t("admin.retry")}
          </button>
        </div>
      )}
      {success && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-forest/20 bg-forest-soft px-4 py-3 text-sm text-forest"
        >
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-line/40 animate-pulse" />
          ))}
        </div>
      ) : !rows.length ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm text-muted">{t("common.noResults")}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="admin-panel space-y-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="break-words font-semibold text-ink">
                    {row.property?.name ?? row.subject ?? row.id}
                  </h4>
                  <p className="text-xs text-muted mt-2">
                    {row.customer?.name && <span>{row.customer.name} · </span>}
                    <span className="font-mono">{row.id.slice(0, 12)}…</span>
                  </p>
                </div>
                <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>
                  {t(`adminConsole.states.${row.status}`, {
                    defaultValue: row.status,
                  })}
                </Badge>
              </div>

              {(row.amount != null || row.total != null) && (
                <p className="text-sm font-semibold text-ink tabular">
                  {new Intl.NumberFormat(i18n.language, {
                    style: "currency",
                    currency: row.currency ?? "AFN",
                    maximumFractionDigits: 0,
                  }).format(row.amount ?? row.total ?? 0)}
                </p>
              )}
              {row.checkIn && (
                <p className="text-sm text-body">
                  {formatDate(row.checkIn)} → {formatDate(row.checkOut!)}
                </p>
              )}
              {row.overallRating && (
                <p className="text-sm text-body">
                  {t("adminConsole.rating")}: {row.overallRating} / 5
                </p>
              )}
              {(row.body || row.comment) && (
                <p className="break-words whitespace-pre-wrap text-sm text-body border-s-2 border-line ps-3">
                  {row.body ?? row.comment}
                </p>
              )}
              {row.response && (
                <p className="text-xs text-muted italic">
                  {t("admin.response")}: {row.response}
                </p>
              )}

              {area === "support" && (
                <textarea
                  aria-label={t("admin.response")}
                  placeholder={t("admin.response")}
                  value={response[row.id] ?? ""}
                  onChange={(e) =>
                    setResponse({ ...response, [row.id]: e.target.value })
                  }
                  rows={2}
                  className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-forest resize-none"
                />
              )}

              {showActions(row) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {rowActions(row).map((action) => (
                    <Button
                      type="button"
                      variant="secondary"
                      key={action}
                      disabled={saving}
                      onClick={() => void change(row.id, action)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                      style={{
                        background: [
                          "approve",
                          "published",
                          "resolved",
                        ].includes(action)
                          ? "var(--color-forest-soft)"
                          : ["reject", "hidden", "flagged", "closed"].includes(
                                action,
                              )
                            ? "var(--color-danger-soft)"
                            : "var(--color-sand-soft)",
                        color: ["approve", "published", "resolved"].includes(
                          action,
                        )
                          ? "var(--color-forest)"
                          : ["reject", "hidden", "flagged", "closed"].includes(
                                action,
                              )
                            ? "var(--color-danger)"
                            : "var(--color-sand)",
                      }}
                    >
                      {t(`adminConsole.actionLabels.${action}`)}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
