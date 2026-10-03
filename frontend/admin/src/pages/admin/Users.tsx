import PageHeader from "../../components/PageHeader";
import ResponsiveTable from "../../components/ResponsiveTable";
import { useAdminSession } from "../../session";
import { assignableRoles, canManageUser } from "../../access";
import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SelectField } from "@/components/ui/SelectField";
import { useState } from "react";
import { Search, UserX, Plus, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

import { providerApi } from "@/services/providerApi";
import { httpClient } from "@/api/httpClient";
import { useAppSelector } from "@/redux/hooks";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt?: string;
}

const api = providerApi.injectEndpoints({
  endpoints: (builder) => ({
    adminUsers: builder.query<User[], string>({
      queryFn: async (search) => {
        try {
          return {
            data: (
              await httpClient.get<User[]>("/admin/users", {
                params: { search },
              })
            ).data,
          };
        } catch {
          return { error: { status: "CUSTOM_ERROR", data: "Request failed" } };
        }
      },
      providesTags: ["Staff"],
    }),
    updateAdminUser: builder.mutation<
      User,
      {
        id: string;
        status?: string;
        role?: string;
        name?: string;
        email?: string;
        phone?: string;
      }
    >({
      queryFn: async ({ id, ...data }) => {
        try {
          return {
            data: (await httpClient.patch<User>(`/admin/users/${id}`, data))
              .data,
          };
        } catch {
          return { error: { status: "CUSTOM_ERROR", data: "Request failed" } };
        }
      },
      invalidatesTags: ["Staff"],
    }),
    deleteAdminUser: builder.mutation<void, string>({
      queryFn: async (id) => {
        try {
          await httpClient.delete(`/admin/users/${id}`);
          return { data: undefined };
        } catch {
          return { error: { status: "CUSTOM_ERROR", data: "Request failed" } };
        }
      },
      invalidatesTags: ["Staff"],
    }),
  }),
  overrideExisting: false,
});

export default function Users() {
  const { t } = useTranslation();
  const actor = useAppSelector((s) => s.auth.user);
  const { formatDate, preferences } = useAdminSession();
  const [editor, setEditor] = useState<User | "new" | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = api.useAdminUsersQuery(query, {
    pollingInterval: preferences.refreshInterval * 1000,
  });
  const [update, { isLoading: saving }] = api.useUpdateAdminUserMutation();
  const editable = (user: User) =>
    canManageUser(actor?.role ?? "", user.role, user.id, actor?.id ?? "");
  async function change(id: string, value: { status?: string; role?: string }) {
    setError("");
    try {
      await update({ id, ...value }).unwrap();
    } catch {
      setError(t("admin.saveError"));
    }
  }
  async function saveUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormSaving(true);
    setFormError("");
    const fields = new FormData(e.currentTarget);
    try {
      const payload = {
        name: String(fields.get("name")),
        email: String(fields.get("email")),
        phone: String(fields.get("phone") ?? "") || undefined,
        role: String(fields.get("role")),
      };
      if (editor === "new")
        await httpClient.post("/admin/users", {
          ...payload,
          password: fields.get("password"),
        });
      else if (editor) await update({ id: editor.id, ...payload }).unwrap();
      await refetch();
      setEditor(null);
    } catch {
      setFormError(t("admin.saveError"));
    } finally {
      setFormSaving(false);
    }
  }
  function roleSelect(user: User) {
    return editable(user) ? (
      <select
        aria-label={t("adminConsole.roleFor", { name: user.name })}
        value={user.role}
        disabled={saving}
        onChange={(e) => void change(user.id, { role: e.target.value })}
        className="w-full rounded-lg border border-line bg-surface px-2 py-2 text-sm"
      >
        {assignableRoles(actor?.role ?? "").map((role) => (
          <option key={role} value={role}>
            {t(`admin.roles.${role}`)}
          </option>
        ))}
      </select>
    ) : (
      <span>{t(`admin.roles.${user.role}`)}</span>
    );
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("admin.users")}
        description={t("adminConsole.usersDescription")}
        action={
          <Button
            onClick={() => {
              setFormError("");
              setEditor("new");
            }}
          >
            <Plus className="h-4 w-4" />
            {t("adminConsole.createUser")}
          </Button>
        }
      />
      <p className="rounded-xl border border-forest/15 bg-forest-soft p-4 text-sm leading-relaxed text-forest-deep">
        {t("adminConsole.roleChangeHelp")}
      </p>
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search);
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            aria-label={t("admin.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("adminConsole.searchUsers")}
            className="w-full min-w-0 bg-transparent text-sm outline-none"
          />
        </div>
        <Button type="submit">{t("admin.search")}</Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => void refetch()}
        >
          {t("adminConsole.refresh")}
        </Button>
      </form>
      {(error || isError) && (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft p-4 text-sm text-danger"
        >
          {error || t("admin.loadError")}
        </p>
      )}
      {isLoading ? (
        <p role="status">{t("common.loading")}</p>
      ) : !data.length ? (
        <div className="admin-panel text-center text-muted">
          {t("common.noResults")}
        </div>
      ) : (
        <ResponsiveTable
          label={t("admin.users")}
          headings={[
            t("console.name"),
            t("admin.email"),
            t("console.role"),
            t("admin.status"),
            t("adminConsole.joined"),
            t("adminConsole.actions"),
          ]}
        >
          {data.map((user) => (
            <tr key={user.id}>
              <td>
                <span className="font-semibold text-ink">{user.name}</span>
              </td>
              <td>
                <span className="break-all">{user.email}</span>
              </td>
              <td>{roleSelect(user)}</td>
              <td>
                <Badge
                  tone={
                    user.status === "active"
                      ? "success"
                      : user.status === "suspended"
                        ? "danger"
                        : "neutral"
                  }
                >
                  {t(`admin.statuses.${user.status}`)}
                </Badge>
              </td>
              <td>{user.createdAt ? formatDate(user.createdAt) : "-"}</td>
              <td>
                <div className="flex flex-wrap gap-2">
                  {editable(user) ? (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setFormError("");
                          setEditor(user);
                        }}
                        aria-label={t("adminConsole.editUser", {
                          name: user.name,
                        })}
                      >
                        <Pencil className="h-4 w-4" />
                        {t("admin.edit")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={saving}
                        onClick={() =>
                          void change(user.id, {
                            status:
                              user.status === "active" ? "suspended" : "active",
                          })
                        }
                      >
                        <UserX className="h-4 w-4" />
                        {t(
                          user.status === "active"
                            ? "admin.suspend"
                            : "admin.activate",
                        )}
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted">
                      {t(
                        user.id === actor?.id
                          ? "adminConsole.yourAccount"
                          : "adminConsole.ownerManaged",
                      )}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </ResponsiveTable>
      )}
      <Modal
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open && !formSaving) setEditor(null);
        }}
        title={t(
          editor === "new"
            ? "adminConsole.createUser"
            : "adminConsole.editUserTitle",
        )}
      >
        <form
          onSubmit={saveUser}
          className="space-y-5"
          key={editor === "new" ? "new" : editor?.id}
        >
          <Field
            id="user-name"
            label={t("console.name")}
            name="name"
            defaultValue={editor && editor !== "new" ? editor.name : ""}
            required
            minLength={2}
            maxLength={100}
          />
          <Field
            id="user-email"
            label={t("admin.email")}
            name="email"
            type="email"
            defaultValue={editor && editor !== "new" ? editor.email : ""}
            required
          />
          <Field
            id="user-phone"
            label={t("console.phone")}
            name="phone"
            type="tel"
            defaultValue={
              editor && editor !== "new" ? (editor.phone ?? "") : ""
            }
          />
          {editor === "new" && (
            <div>
              <label className="mb-2 block text-sm" htmlFor="new-password">
                {t("adminConsole.initialPassword")}
              </label>
              <PasswordInput
                id="new-password"
                name="password"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
              />
            </div>
          )}
          <SelectField
            id="user-role"
            label={t("console.role")}
            name="role"
            defaultValue={editor && editor !== "new" ? editor.role : "customer"}
          >
            {assignableRoles(actor?.role ?? "").map((role) => (
              <option key={role} value={role}>
                {t(`admin.roles.${role}`)}
              </option>
            ))}
          </SelectField>
          {formError && (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={formSaving}
              onClick={() => setEditor(null)}
            >
              {t("admin.close")}
            </Button>
            <Button disabled={formSaving}>
              {t(formSaving ? "common.loading" : "common.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
