import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Camera, LockKeyhole, UserRound } from "lucide-react";
import { httpClient } from "@/api/httpClient";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import { providerApi } from "@/services/providerApi";
import { useAdminSession, type Profile } from "../../session";
import PageHeader from "../../components/PageHeader";
import Avatar from "../../components/Avatar";

export default function Account() {
  const { t } = useTranslation();
  const { profile, update } = useAdminSession();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [busy, setBusy] = useState<"profile" | "avatar" | "password" | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy("profile");
    setMessage("");
    try {
      const { data } = await httpClient.patch<Profile>("/users/me", {
        name,
        email,
        phone: phone || null,
      });
      update(data);
      setFailed(false);
      setMessage(t("admin.saved"));
    } catch {
      setFailed(true);
      setMessage(t("admin.saveError"));
    } finally {
      setBusy(null);
    }
  }
  async function saveAvatar(avatar: string | null) {
    const { data } = await httpClient.patch<Profile>("/users/me/avatar", {
      avatar,
    });
    update(data);
    setFailed(false);
    setMessage(t("admin.saved"));
  }
  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy("avatar");
    setMessage("");
    try {
      if (
        !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024
      )
        throw new Error("image");
      const bitmap = await createImageBitmap(file);
      try {
        const size = Math.min(bitmap.width, bitmap.height);
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext("2d");
        if (!context || !size) throw new Error("image");
        context.drawImage(
          bitmap,
          (bitmap.width - size) / 2,
          (bitmap.height - size) / 2,
          size,
          size,
          0,
          0,
          256,
          256,
        );
        await saveAvatar(canvas.toDataURL("image/webp", 0.85));
      } finally {
        bitmap.close();
      }
    } catch {
      setFailed(true);
      setMessage(t("adminConsole.imageError"));
    } finally {
      setBusy(null);
    }
  }
  async function removeAvatar() {
    setBusy("avatar");
    setMessage("");
    try {
      await saveAvatar(null);
    } catch {
      setFailed(true);
      setMessage(t("admin.saveError"));
    } finally {
      setBusy(null);
    }
  }
  async function password(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("newPassword"));
    const currentPassword = String(form.get("currentPassword"));
    if (newPassword !== form.get("confirmPassword")) {
      setFailed(true);
      setMessage(t("adminConsole.passwordMismatch"));
      return;
    }
    setBusy("password");
    setMessage("");
    try {
      await httpClient.patch("/users/me/password", {
        currentPassword,
        newPassword,
      });
      dispatch(providerApi.util.resetApiState());
      dispatch(logout());
      navigate("/login?reason=passwordChanged", { replace: true });
    } catch (error) {
      const reason = (
        error as { response?: { data?: { error?: { message?: string } } } }
      ).response?.data?.error?.message;
      setFailed(true);
      setMessage(
        t(
          reason === "Current password is incorrect"
            ? "adminConsole.currentPasswordWrong"
            : "admin.saveError",
        ),
      );
    } finally {
      setBusy(null);
    }
  }
  if (!profile) return null;
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("console.profile")}
        description={t("adminConsole.profileDescription")}
      />
      {message && (
        <p
          role={failed ? "alert" : "status"}
          className={`rounded-xl p-4 text-sm ${failed ? "bg-danger-soft text-danger" : "bg-forest-soft text-forest"}`}
        >
          {message}
        </p>
      )}
      <section className="admin-panel flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <Avatar name={profile.name} image={profile.avatar} large />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="break-words text-lg">{profile.name}</h3>
            <p className="mt-2 text-sm text-muted">
              {t(`admin.roles.${profile.role}`)}
            </p>
          </div>
          <p className="text-sm text-muted">{t("adminConsole.avatarHelp")}</p>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-label={t("adminConsole.uploadPhoto")}
            onChange={(e) => void upload(e)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={busy !== null}
              onClick={() => fileInput.current?.click()}
            >
              <Camera className="h-4 w-4" />
              {t(
                busy === "avatar"
                  ? "common.loading"
                  : "adminConsole.uploadPhoto",
              )}
            </Button>
            {profile.avatar && (
              <Button
                variant="ghost"
                disabled={busy !== null}
                onClick={() => void removeAvatar()}
              >
                {t("adminConsole.removePhoto")}
              </Button>
            )}
          </div>
        </div>
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <form onSubmit={save} className="admin-panel space-y-5">
          <div className="admin-panel-heading">
            <h3 className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-forest" />
              {t("adminConsole.personalDetails")}
            </h3>
            <p>{t("adminConsole.detailsHelp")}</p>
          </div>
          <Field
            id="profile-name"
            label={t("console.name")}
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Field
            id="profile-email"
            label={t("admin.email")}
            autoComplete="email"
            type="email"
            required
            maxLength={160}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            id="profile-phone"
            label={t("console.phone")}
            autoComplete="tel"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button disabled={busy !== null}>
            {t(busy === "profile" ? "common.loading" : "common.save")}
          </Button>
        </form>
        <form onSubmit={password} className="admin-panel space-y-5">
          <div className="admin-panel-heading">
            <h3 className="flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-forest" />
              {t("adminConsole.changePassword")}
            </h3>
            <p>{t("adminConsole.passwordHelp")}</p>
          </div>
          {(["currentPassword", "newPassword", "confirmPassword"] as const).map(
            (key) => (
              <div key={key}>
                <label className="mb-2 block text-sm font-medium" htmlFor={key}>
                  {t(`adminConsole.${key}`)}
                </label>
                <PasswordInput
                  id={key}
                  name={key}
                  autoComplete={
                    key === "currentPassword"
                      ? "current-password"
                      : "new-password"
                  }
                  required
                  minLength={key === "currentPassword" ? 1 : 8}
                  maxLength={72}
                />
              </div>
            ),
          )}
          <Button disabled={busy !== null}>
            {t(
              busy === "password"
                ? "common.loading"
                : "adminConsole.changePassword",
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
