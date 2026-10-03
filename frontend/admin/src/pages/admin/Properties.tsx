import PageHeader from "../../components/PageHeader";
import ResponsiveTable from "../../components/ResponsiveTable";
import { useAdminSession } from "../../session";
import { useAppSelector } from "@/redux/hooks";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Building2, Pencil, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { SelectField } from "@/components/ui/SelectField";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { providerApi } from "@/services/providerApi";
import { httpClient } from "@/api/httpClient";
interface Property {
  id: string;
  name: string;
  slug: string;
  type: string;
  address: string;
  district: string;
  description?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  photos: string[];
  ownerId: string;
  verificationStatus: string;
  owner?: { name: string; email: string };
  createdAt: string;
}
const api = providerApi.injectEndpoints({
  endpoints: (b) => ({
    propertyOwners: b.query<
      { id: string; name: string; email: string; role: string }[],
      void
    >({
      queryFn: async () => {
        try {
          return { data: (await httpClient.get("/admin/users")).data };
        } catch {
          return {
            error: { status: "CUSTOM_ERROR", data: "Unable to load owners" },
          };
        }
      },
      providesTags: ["Staff"],
    }),
    managedProperties: b.query<Property[], void>({
      queryFn: async () => {
        try {
          return {
            data: (await httpClient.get<Property[]>("/properties")).data,
          };
        } catch {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: "Unable to load properties",
            },
          };
        }
      },
      providesTags: ["Property"],
    }),
  }),
});
const types = [
  "hotel",
  "hostel",
  "dormitory",
  "guesthouse",
  "room",
  "apartment",
];
const statuses = [
  "draft",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "rejected",
  "suspended",
];
function errorMessage(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { error?: { message?: string } } } })
      .response?.data?.error?.message ?? fallback
  );
}
export default function Properties() {
  const { t } = useTranslation();
  const { preferences } = useAdminSession();
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = api.useManagedPropertiesQuery(undefined, {
    pollingInterval: preferences.refreshInterval * 1000,
  });
  const canEdit = useAppSelector((s) =>
    ["admin", "super_admin"].includes(s.auth.user?.role ?? ""),
  );
  const { data: owners = [] } = api.usePropertyOwnersQuery(undefined, {
    skip: !canEdit,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editor, setEditor] = useState<Property | "new" | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const open = (property: Property | "new") => {
    setError("");
    setPhotos(property === "new" ? [] : (property.photos ?? []));
    setEditor(property);
  };
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const body = {
        name: form.get("name"),
        slug: form.get("slug"),
        type: form.get("type"),
        address: form.get("address"),
        district: form.get("district"),
        description: form.get("description"),
        latitude: Number(form.get("latitude")),
        longitude: Number(form.get("longitude")),
        phone: form.get("phone") || undefined,
        email: form.get("email") || undefined,
        ownerId: form.get("ownerId") || undefined,
        photos,
      };
      if (editor === "new") await httpClient.post("/properties", body);
      else if (editor) await httpClient.patch(`/properties/${editor.id}`, body);
      await refetch();
      setEditor(null);
    } catch (e) {
      setError(errorMessage(e, t("admin.saveError")));
    } finally {
      setSaving(false);
    }
  }
  async function action(p: Property, action: string) {
    if (
      action === "suspend" &&
      !confirm(t("adminConsole.suspendPropertyConfirm", { name: p.name }))
    )
      return;
    setSaving(true);
    setError("");
    try {
      if (action === "suspend") await httpClient.delete(`/properties/${p.id}`);
      else if (action === "submit")
        await httpClient.post(`/properties/${p.id}/submit`);
      else
        await httpClient.patch(`/properties/${p.id}/review`, {
          status: action,
        });
      await refetch();
    } catch (e) {
      setError(errorMessage(e, t("admin.saveError")));
    } finally {
      setSaving(false);
    }
  }
  const current = editor && editor !== "new" ? editor : null;
  const rows = data.filter(
    (p) =>
      (!status || p.verificationStatus === status) &&
      [p.name, p.district, p.owner?.name, p.owner?.email].some((v) =>
        v?.toLowerCase().includes(search.toLowerCase()),
      ),
  );
  return (
    <div className="space-y-5">
      <PageHeader
        title={t("admin.properties")}
        description={t("adminConsole.propertiesDescription")}
        action={
          canEdit && (
            <Button onClick={() => open("new")}>
              <Plus className="h-4 w-4" />
              {t("adminConsole.addProperty")}
            </Button>
          )
        }
      />
      <div className="flex flex-wrap gap-3">
        <div className="flex min-w-0 basis-full sm:basis-auto flex-1 items-center gap-2 rounded-md border border-line bg-surface px-3">
          <Search className="h-4 w-4 text-muted" />
          <input
            aria-label={t("admin.search")}
            className="w-full bg-transparent py-2 text-sm outline-none"
            placeholder={t("adminConsole.searchProperties")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label={t("admin.status")}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full sm:w-auto rounded-md border border-line bg-surface px-3 py-2 text-sm"
        >
          <option value="">{t("adminConsole.allStatuses")}</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {t(`adminConsole.states.${s}`)}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-md bg-danger-soft p-3 text-sm text-danger"
        >
          {error}
        </p>
      )}
      {isLoading ? (
        <p className="text-muted">{t("common.loading")}</p>
      ) : isError ? (
        <Card>
          <CardBody>
            <p role="alert">{t("admin.loadError")}</p>
            <Button onClick={() => void refetch()}>{t("admin.retry")}</Button>
          </CardBody>
        </Card>
      ) : !rows.length ? (
        <Card>
          <CardBody className="py-10 text-center text-muted">
            {t("common.noResults")}
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <ResponsiveTable
              label={t("admin.properties")}
              headings={[
                t("adminConsole.property"),
                t("adminConsole.owner"),
                t("adminConsole.location"),
                t("admin.status"),
                t("adminConsole.actions"),
              ]}
            >
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-line last:border-0 hover:bg-paper"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {p.photos?.[0] ? (
                        <img
                          src={p.photos[0]}
                          alt=""
                          className="h-12 w-16 rounded-md object-cover"
                        />
                      ) : (
                        <Building2 className="h-10 w-10 rounded-md bg-forest-soft p-2 text-forest" />
                      )}
                      <div>
                        <p className="font-medium text-ink">{p.name}</p>
                        <p className="text-xs capitalize text-muted">
                          {t(`adminConsole.types.${p.type}`)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p>{p.owner?.name}</p>
                    <p className="text-xs text-muted">{p.owner?.email}</p>
                  </td>
                  <td className="px-5 py-3">{p.district}</td>
                  <td className="px-5 py-3">
                    <Badge
                      tone={
                        p.verificationStatus === "approved"
                          ? "success"
                          : ["rejected", "suspended"].includes(
                                p.verificationStatus,
                              )
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {t(`adminConsole.states.${p.verificationStatus}`)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      {canEdit && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => open(p)}
                        >
                          <Pencil className="h-3 w-3" />
                          {t("admin.edit")}
                        </Button>
                      )}
                      {canEdit &&
                        ["draft", "changes_requested"].includes(
                          p.verificationStatus,
                        ) && (
                          <Button
                            size="sm"
                            disabled={saving}
                            onClick={() => void action(p, "submit")}
                          >
                            {t("adminConsole.submit")}
                          </Button>
                        )}
                      {["submitted", "under_review"].includes(
                        p.verificationStatus,
                      ) && (
                        <>
                          <Button
                            size="sm"
                            disabled={saving}
                            onClick={() => void action(p, "approved")}
                          >
                            {t("adminConsole.approve")}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={saving}
                            onClick={() => void action(p, "changes_requested")}
                          >
                            {t("adminConsole.requestChanges")}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={saving}
                            onClick={() => void action(p, "rejected")}
                          >
                            {t("adminConsole.reject")}
                          </Button>
                        </>
                      )}
                      {canEdit && p.verificationStatus !== "suspended" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={saving}
                          onClick={() => void action(p, "suspend")}
                        >
                          {t("admin.suspend")}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </ResponsiveTable>
          </div>
        </Card>
      )}
      <Modal
        open={editor !== null}
        onOpenChange={(v) => {
          if (!v && !saving) setEditor(null);
        }}
        title={t(
          editor === "new"
            ? "adminConsole.addProperty"
            : "adminConsole.editProperty",
        )}
        size="lg"
      >
        <form onSubmit={save} className="space-y-4" key={current?.id ?? "new"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="name"
              label={t("adminConsole.propertyName")}
              defaultValue={current?.name}
              required
              maxLength={160}
            />
            <Field
              name="slug"
              label={t("adminConsole.propertySlug")}
              defaultValue={current?.slug}
              required
              maxLength={180}
            />
            <SelectField
              name="type"
              label={t("adminConsole.accommodationType")}
              defaultValue={current?.type ?? "hotel"}
            >
              {types.map((v) => (
                <option key={v} value={v}>
                  {t(`adminConsole.types.${v}`)}
                </option>
              ))}
            </SelectField>
            <SelectField
              name="ownerId"
              label={t("adminConsole.owner")}
              defaultValue={current?.ownerId ?? ""}
            >
              <option value="">{t("adminConsole.currentAdmin")}</option>
              {owners
                .filter((u) =>
                  ["property_owner", "admin", "super_admin"].includes(u.role),
                )
                .map((u) => (
                  <option value={u.id} key={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
            </SelectField>
            <Field
              name="address"
              label={t("adminConsole.address")}
              defaultValue={current?.address}
              required
            />
            <Field
              name="district"
              label={t("adminConsole.district")}
              defaultValue={current?.district}
              required
            />
            <Field
              name="latitude"
              label={t("adminConsole.latitude")}
              type="number"
              step="any"
              min={-90}
              max={90}
              defaultValue={current?.latitude ?? 34.5155}
              required
            />
            <Field
              name="longitude"
              label={t("adminConsole.longitude")}
              type="number"
              step="any"
              min={-180}
              max={180}
              defaultValue={current?.longitude ?? 69.1833}
              required
            />
            <Field
              name="phone"
              label={t("console.phone")}
              defaultValue={current?.phone ?? ""}
            />
            <Field
              name="email"
              label={t("admin.email")}
              type="email"
              defaultValue={current?.email ?? ""}
            />
          </div>
          <Field
            name="description"
            label={t("adminConsole.description")}
            defaultValue={current?.description ?? ""}
          />
          <ImageUploadField
            onProcessingChange={setUploading}
            label={t("adminConsole.propertyPhotos")}
            images={photos}
            onChange={setPhotos}
            helperText={t("adminConsole.coverHelp")}
          />
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              type="button"
              disabled={saving}
              onClick={() => setEditor(null)}
            >
              {t("admin.close")}
            </Button>
            <Button type="submit" disabled={saving || uploading}>
              {saving ? t("common.loading") : t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
