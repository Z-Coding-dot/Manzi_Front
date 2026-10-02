import { Field } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SelectField } from "@/components/ui/SelectField";
import { useState } from "react";
import { Loader2, Search, Trash2, UserX, Plus, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
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

const ROLES = [
  "customer",
  "property_owner",
  "property_manager",
  "receptionist",
  "property_staff",
  "verification_agent",
  "support_agent",
  "finance_agent",
  "content_manager",
  "admin",
  "super_admin",
];

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

const STATUS_TONE: Record<string, "success" | "danger" | "neutral"> = {
  active: "success",
  suspended: "danger",
  pending: "neutral",
};

export default function Users() {
  const { t, i18n } = useTranslation();
  const actor = useAppSelector((s) => s.auth.user);
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
  } = api.useAdminUsersQuery(query);
  const [update, { isLoading: saving }] = api.useUpdateAdminUserMutation();
  const [deleteUser] = api.useDeleteAdminUserMutation();

  async function change(
    id: string,
    value: {
      status?: string;
      role?: string;
      name?: string;
      email?: string;
      phone?: string;
    },
  ) {
    setError("");
    try {
      await update({ id, ...value }).unwrap();
    } catch {
      setError(t("admin.saveError"));
    }
  }

  async function handleDelete(id: string, name: string) {
    if (
      !confirm(
        `Deactivate user "${name}"? Their sessions will be revoked. You can reactivate them later.`,
      )
    )
      return;
    try {
      await deleteUser(id).unwrap();
    } catch {
      setError("Failed to deactivate user.");
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
      };
      if (editor === "new")
        await httpClient.post("/admin/users", {
          ...payload,
          password: fields.get("password"),
          role: fields.get("role"),
        });
      else if (editor) await update({ id: editor.id, ...payload }).unwrap();
      await refetch();
      setEditor(null);
    } catch (error) {
      setFormError(
        (error as { response?: { data?: { error?: { message?: string } } } })
          .response?.data?.error?.message ?? t("admin.saveError"),
      );
    } finally {
      setFormSaving(false);
    }
  }
  return (
    <div className="space-y-5">
      <Modal
        open={editor !== null}
        onOpenChange={(v) => {
          if (!v && !formSaving) setEditor(null);
        }}
        title={editor === "new" ? "Create user" : "Edit user"}
      >
        <form
          onSubmit={saveUser}
          className="space-y-4"
          key={editor === "new" ? "new" : editor?.id}
        >
          <Field
            label="Name"
            name="name"
            defaultValue={editor && editor !== "new" ? editor.name : ""}
            required
            minLength={2}
            maxLength={100}
          />
          <Field
            label="Email"
            name="email"
            type="email"
            defaultValue={editor && editor !== "new" ? editor.email : ""}
            required
          />
          <Field
            label="Phone (for staff sign-in and property assignment)"
            name="phone"
            type="tel"
            placeholder="+937XXXXXXXX"
            defaultValue={
              editor && editor !== "new" ? (editor.phone ?? "") : ""
            }
          />
          {editor === "new" && (
            <>
              <label className="block text-sm text-body" htmlFor="new-password">
                Initial password
              </label>
              <PasswordInput
                id="new-password"
                name="password"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
              />
              <SelectField
                label="Role"
                name="role"
                defaultValue="property_owner"
              >
                {ROLES.filter(
                  (role) =>
                    actor?.role === "super_admin" ||
                    [
                      "customer",
                      "property_owner",
                      "property_manager",
                      "receptionist",
                      "property_staff",
                    ].includes(role),
                ).map((role) => (
                  <option key={role} value={role}>
                    {t(`admin.roles.${role}`)}
                  </option>
                ))}
              </SelectField>
            </>
          )}
          {formError && (
            <p role="alert" className="text-sm text-danger">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={formSaving}
              onClick={() => setEditor(null)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formSaving}>
              {formSaving ? t("common.loading") : t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>
      <Button
        onClick={() => {
          setFormError("");
          setEditor("new");
        }}
      >
        <Plus className="h-4 w-4" />
        Create user
      </Button>
      <div>
        <h2 className="text-xl font-semibold text-ink">{t("admin.users")}</h2>
        <p className="mt-1 text-sm text-muted">
          Manage user accounts, roles, and account statuses.
        </p>
      </div>

      <form
        className="flex gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(search);
        }}
      >
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
          <Search className="h-4 w-4 text-muted shrink-0" />
          <input
            aria-label={t("admin.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="flex-1 bg-transparent text-sm outline-none text-ink placeholder:text-muted"
          />
        </div>
        <Button type="submit">
          <Search className="h-4 w-4 mr-1.5" /> {t("admin.search")}
        </Button>
      </form>

      {(error || isError) && (
        <div
          role="alert"
          className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {error || t("admin.loadError")}
          <button
            onClick={() => void refetch()}
            className="ml-3 underline text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-line/40 animate-pulse" />
          ))}
        </div>
      ) : !data.length ? (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-sm text-muted">{t("common.noResults")}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                {["Name", "Email", "Role", "Status", "Joined", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-start font-semibold"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-line last:border-0 hover:bg-paper transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium text-ink">
                    {user.name}
                  </td>
                  <td className="px-5 py-3.5 text-body">{user.email}</td>
                  <td className="px-5 py-3.5">
                    {actor?.role === "super_admin" && user.id !== actor.id ? (
                      <select
                        value={user.role}
                        disabled={saving}
                        onChange={(e) =>
                          void change(user.id, { role: e.target.value })
                        }
                        className="rounded-md border border-line bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-forest"
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {t(`admin.roles.${role}`)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-body capitalize">
                        {user.role.replace(/_/g, " ")}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone={STATUS_TONE[user.status] ?? "neutral"}>
                      {t(`admin.statuses.${user.status}`)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-body tabular">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString(
                          i18n.language,
                        )
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {user.id !== actor?.id &&
                        (actor?.role === "super_admin" ||
                          !["admin", "super_admin"].includes(user.role)) && (
                          <button
                            aria-label={`Edit ${user.name}`}
                            onClick={() => {
                              setFormError("");
                              setEditor(user);
                            }}
                            className="rounded-md p-2 text-forest hover:bg-forest-soft"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                      <button
                        disabled={
                          saving ||
                          user.id === actor?.id ||
                          (actor?.role !== "super_admin" &&
                            ["admin", "super_admin"].includes(user.role))
                        }
                        onClick={() =>
                          void change(user.id, {
                            status:
                              user.status === "active" ? "suspended" : "active",
                          })
                        }
                        title={
                          user.status === "active" ? "Suspend" : "Activate"
                        }
                        className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors disabled:opacity-40"
                        style={{
                          color:
                            user.status === "active"
                              ? "var(--color-danger)"
                              : "var(--color-forest)",
                          background:
                            user.status === "active"
                              ? "var(--color-danger-soft)"
                              : "var(--color-forest-soft)",
                        }}
                      >
                        {saving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserX className="h-3.5 w-3.5" />
                        )}
                        {user.status === "active"
                          ? t("admin.suspend")
                          : t("admin.activate")}
                      </button>
                      {actor?.role === "super_admin" &&
                        user.id !== actor.id && (
                          <button
                            onClick={() =>
                              void handleDelete(user.id, user.name)
                            }
                            title="Deactivate user"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
