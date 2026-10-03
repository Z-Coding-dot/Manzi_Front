import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { httpClient } from "@/api/httpClient";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { loginSuccess, logout, type AuthUser } from "@/redux/slices/authSlice";
import { providerApi } from "@/services/providerApi";

export interface Preferences {
  density: "comfortable" | "compact";
  dateFormat: "locale" | "iso";
  timeZone: "Asia/Kabul" | "UTC";
  refreshInterval: number;
  reducedMotion: boolean;
}
export const defaultPreferences: Preferences = {
  density: "comfortable",
  dateFormat: "locale",
  timeZone: "Asia/Kabul",
  refreshInterval: 60,
  reducedMotion: false,
};
export interface Profile extends AuthUser {
  email: string | null;
  phone: string | null;
  language: string;
  currency: string;
  consolePreferences: Partial<Preferences>;
}
interface Session {
  profile: Profile | null;
  preferences: Preferences;
  loading: boolean;
  failed: boolean;
  reload: () => Promise<void>;
  update: (profile: Profile) => void;
  formatDate: (date: string, includeTime?: boolean) => string;
}
export const AdminSessionContext = createContext<Session | null>(null);
export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const authenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const currentRole = useRef<string | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const active = useRef(true);
  const update = useCallback(
    (next: Profile) => {
      if (!active.current) return;
      if (currentRole.current && currentRole.current !== next.role)
        dispatch(providerApi.util.resetApiState());
      currentRole.current = next.role;
      setProfile(next);
      dispatch(loginSuccess({ ...next, propertyName: "" }));
    },
    [dispatch],
  );
  const reload = useCallback(async () => {
    try {
      const { data } = await httpClient.get<Profile>("/users/me");
      update(data);
      if (active.current) setFailed(false);
    } catch {
      if (active.current) setFailed(true);
    } finally {
      if (active.current) setLoading(false);
    }
  }, [update]);
  useEffect(() => {
    active.current = true;
    if (!authenticated) {
      setLoading(false);
      return;
    }
    void reload();
    const refresh = () => {
      if (document.visibilityState === "visible") void reload();
    };
    const expired = () => {
      active.current = false;
      dispatch(providerApi.util.resetApiState());
      dispatch(logout());
    };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    window.addEventListener("manzil:session-expired", expired);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active.current = false;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("manzil:session-expired", expired);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [authenticated, reload, dispatch]);
  const preferences = { ...defaultPreferences, ...profile?.consolePreferences };
  function formatDate(value: string, includeTime = false) {
    const date = new Date(value);
    if (preferences.dateFormat === "iso") {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: preferences.timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(date);
      const part = (key: string) => parts.find((p) => p.type === key)?.value;
      const day = `${part("year")}-${part("month")}-${part("day")}`;
      return includeTime
        ? `${day} ${date.toLocaleTimeString(i18n.language, { timeZone: preferences.timeZone, hour: "2-digit", minute: "2-digit" })}`
        : day;
    }
    return date.toLocaleString(i18n.language, {
      timeZone: preferences.timeZone,
      year: "numeric",
      month: "short",
      day: "numeric",
      ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
  }
  return (
    <AdminSessionContext.Provider
      value={{
        profile,
        preferences,
        loading,
        failed,
        reload,
        update,
        formatDate,
      }}
    >
      {children}
    </AdminSessionContext.Provider>
  );
}
export function useAdminSession() {
  const session = useContext(AdminSessionContext);
  if (!session) throw new Error("Admin session is missing");
  return session;
}
