import PageHeader from "../../components/PageHeader";
import { useAdminSession } from "../../session";
import { Field } from "@/components/ui/Field";
import { SelectField } from "@/components/ui/SelectField";
import { LANGUAGES } from "@/i18n/config";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { providerApi } from "@/services/providerApi";
import { httpClient } from "@/api/httpClient";
import { Button } from "@/components/ui/Button";
import { useAppSelector } from "@/redux/hooks";
type Kind = "pages" | "banners" | "posts" | "settings";
interface ContentRecord {
  id?: string;
  key?: string;
  title?: string;
  slug?: string;
  locale?: string;
  body?: string;
  status?: string;
  seoTitle?: string;
  seoDescription?: string;
  image?: string;
  link?: string;
  coverImage?: string;
  sortOrder?: number;
  active?: boolean;
  value?: unknown;
}
const api = providerApi.injectEndpoints({
  endpoints: (builder) => ({
    cmsRecords: builder.query<ContentRecord[], Kind>({
      queryFn: async (kind) => {
        try {
          return {
            data: (await httpClient.get<ContentRecord[]>(`/admin/cms/${kind}`))
              .data,
          };
        } catch {
          return { error: { status: "CUSTOM_ERROR", data: "Request failed" } };
        }
      },
      providesTags: ["Property"],
    }),
    saveContent: builder.mutation<
      ContentRecord,
      { kind: Kind; id?: string; body: Record<string, unknown> }
    >({
      queryFn: async ({ kind, id, body }) => {
        try {
          return {
            data: (
              await httpClient.request<ContentRecord>({
                url: `/admin/cms/${kind}${id ? `/${id}` : ""}`,
                method: id ? "PATCH" : "POST",
                data: body,
              })
            ).data,
          };
        } catch {
          return { error: { status: "CUSTOM_ERROR", data: "Request failed" } };
        }
      },
      invalidatesTags: ["Property"],
    }),
  }),
});
export default function Content({ platform = false }: { platform?: boolean }) {
  const canManageSettings = useAppSelector(
    (s) => s.auth.user?.role === "super_admin",
  );
  const { t } = useTranslation();
  const { preferences } = useAdminSession();
  const [kind, setKind] = useState<Kind>(platform ? "settings" : "pages");
  const [record, setRecord] = useState<ContentRecord | null>(null);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = api.useCmsRecordsQuery(kind, {
    pollingInterval: preferences.refreshInterval * 1000,
  });
  const [save, { isLoading: saving }] = api.useSaveContentMutation();
  function field(key: keyof ContentRecord, value: unknown) {
    setRecord((r) => ({ ...r, [key]: value }));
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!record) return;
    setMessage("");
    let body: Record<string, unknown>;
    if (kind === "settings") {
      try {
        const value =
          typeof record.value === "string"
            ? record.value
            : JSON.stringify(record.value);
        if (JSON.parse(value ?? "null") === null) throw new Error();
        body = { key: record.key, value };
      } catch {
        setFailed(true);
        setMessage(t("adminConsole.invalidJSON"));
        return;
      }
    } else if (kind === "banners")
      body = {
        locale: record.locale,
        title: record.title,
        body: record.body ?? "",
        image: record.image || undefined,
        link: record.link || undefined,
        sortOrder: Number(record.sortOrder ?? 0),
        active: Boolean(record.active),
      };
    else
      body = {
        slug: record.slug,
        locale: record.locale,
        title: record.title,
        body: record.body ?? "",
        status: record.status,
        ...(kind === "pages"
          ? {
              seoTitle: record.seoTitle || undefined,
              seoDescription: record.seoDescription || undefined,
            }
          : { coverImage: record.coverImage || undefined }),
      };
    try {
      await save({ kind, id: record.id, body }).unwrap();
      setFailed(false);
      setMessage(t("admin.saved"));
      setRecord(null);
    } catch {
      setFailed(true);
      setMessage(t("admin.saveError"));
    }
  }
  const textField = (key: keyof ContentRecord, required = false) => (
    <Field
      key={key}
      id={`content-${key}`}
      label={t(`admin.contentFields.${key}`)}
      required={required}
      value={String(record?.[key] ?? "")}
      onChange={(e) => field(key, e.target.value)}
    />
  );
  return (
    <div className="space-y-5">
      {platform ? (
        <div className="admin-panel-heading">
          <h3>{t("adminConsole.platformSettings")}</h3>
          <p>{t("adminConsole.platformSettingsHelp")}</p>
        </div>
      ) : (
        <PageHeader
          title={t("admin.content")}
          description={t("adminConsole.contentDescription")}
        />
      )}
      {!platform && (
        <div className="flex flex-wrap gap-2">
          {(["pages", "banners", "posts"] as Kind[]).map((k) => (
            <Button
              key={k}
              variant={kind === k ? "primary" : "secondary"}
              onClick={() => {
                setKind(k);
                setRecord(null);
                setMessage("");
              }}
            >
              {t(`admin.contentKinds.${k}`)}
            </Button>
          ))}
        </div>
      )}
      {message && (
        <p
          role={failed ? "alert" : "status"}
          className={`rounded-xl p-4 text-sm ${failed ? "bg-danger-soft text-danger" : "bg-forest-soft text-forest"}`}
        >
          {message}
        </p>
      )}
      {(kind !== "settings" || canManageSettings) && (
        <Button
          onClick={() => {
            setMessage("");
            setRecord({
              locale: "en",
              status: "draft",
              body: "",
              active: false,
              sortOrder: 0,
              value: "{}",
            });
          }}
        >
          {t("admin.create")}
        </Button>
      )}
      {record && (
        <form
          onSubmit={(e) => void submit(e)}
          className="admin-panel space-y-5"
        >
          {kind === "settings" ? (
            <>
              {textField("key", true)}
              <label className="block space-y-2">
                <span>{t("admin.contentFields.value")}</span>
                <textarea
                  required
                  dir="ltr"
                  value={
                    typeof record.value === "string"
                      ? record.value
                      : JSON.stringify(record.value, null, 2)
                  }
                  onChange={(e) => field("value", e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-line bg-paper p-3 font-mono text-sm"
                />
              </label>
            </>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                {textField("title", true)}
                {kind !== "banners" && textField("slug", true)}
                <SelectField
                  id="content-locale"
                  label={t("admin.contentFields.locale")}
                  value={record.locale}
                  onChange={(e) => field("locale", e.target.value)}
                >
                  {Object.entries(LANGUAGES).map(([key, meta]) => (
                    <option key={key} value={key.replace("-", "_")}>
                      {meta.nativeLabel}
                    </option>
                  ))}
                </SelectField>
                {kind !== "banners" && (
                  <SelectField
                    id="content-status"
                    label={t("admin.status")}
                    value={record.status}
                    onChange={(e) => field("status", e.target.value)}
                  >
                    <option value="draft">{t("admin.draft")}</option>
                    <option value="published">{t("admin.publish")}</option>
                  </SelectField>
                )}
              </div>
              <label className="block space-y-2">
                <span>{t("admin.contentFields.body")}</span>
                <textarea
                  rows={8}
                  dir={record.locale === "en" ? "ltr" : "rtl"}
                  value={record.body}
                  onChange={(e) => field("body", e.target.value)}
                  className="w-full rounded-xl border border-line bg-paper p-3 text-sm"
                />
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                {kind === "banners" ? (
                  <>
                    {textField("image")}
                    {textField("link")}
                    <Field
                      id="content-order"
                      label={t("admin.contentFields.sortOrder")}
                      type="number"
                      value={record.sortOrder ?? 0}
                      onChange={(e) =>
                        field("sortOrder", Number(e.target.value))
                      }
                    />
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-forest"
                        checked={record.active ?? false}
                        onChange={(e) => field("active", e.target.checked)}
                      />
                      {t("admin.contentFields.active")}
                    </label>
                  </>
                ) : kind === "pages" ? (
                  <>
                    {textField("seoTitle")}
                    {textField("seoDescription")}
                  </>
                ) : (
                  textField("coverImage")
                )}
              </div>
            </>
          )}
          <div className="flex flex-wrap gap-3">
            <Button disabled={saving}>{t("admin.save")}</Button>
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => setRecord(null)}
            >
              {t("admin.close")}
            </Button>
          </div>
        </form>
      )}
      {isLoading ? (
        <p role="status">{t("common.loading")}</p>
      ) : isError ? (
        <div role="alert" className="admin-panel space-y-3">
          {t("admin.loadError")}
          <Button onClick={() => void refetch()}>{t("admin.retry")}</Button>
        </div>
      ) : !data.length ? (
        <div className="admin-panel text-sm text-muted">
          {t("common.noResults")}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((item) => (
            <section
              key={item.id ?? item.key}
              className="admin-panel flex min-w-0 flex-col items-start gap-4"
            >
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-base">
                  {item.title ?? item.key}
                </h3>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
                  {item.locale && (
                    <span>
                      {
                        LANGUAGES[
                          item.locale.replace(
                            "_",
                            "-",
                          ) as keyof typeof LANGUAGES
                        ]?.nativeLabel
                      }
                    </span>
                  )}
                  {item.status && (
                    <span>{t(`adminConsole.states.${item.status}`)}</span>
                  )}
                  {item.slug && (
                    <span dir="ltr" className="break-all">
                      /{item.slug}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  setRecord({
                    ...item,
                    value:
                      item.value === undefined
                        ? undefined
                        : JSON.stringify(item.value, null, 2),
                  })
                }
              >
                {t("admin.edit")}
              </Button>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
