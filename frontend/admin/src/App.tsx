import { lazy, Suspense, useEffect, useState } from "react";
import { Provider } from "react-redux";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  Link,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  ScrollText,
  Shield,
  Star,
  Users,
  Wallet,
  X,
  Settings as SettingsIcon,
} from "lucide-react";
import { store } from "@/redux/store";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { getDirection } from "@/i18n/config";
import { Button } from "@/components/ui/Button";
import { httpClient } from "@/api/httpClient";
import { sessionStorageForAuth } from "@/api/session";
import { providerApi } from "@/services/providerApi";
import BrandLogo from "./components/BrandLogo";
import Avatar from "./components/Avatar";
import Login from "./pages/auth/Login";
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Properties = lazy(() => import("./pages/admin/Properties"));
const UsersPage = lazy(() => import("./pages/admin/Users"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const Content = lazy(() => import("./pages/admin/Content"));
const Operations = lazy(() => import("./pages/admin/Operations"));
const Account = lazy(() => import("./pages/admin/Profile"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const Access = lazy(() => import("./pages/admin/Access"));
import { canAccess, platformRoles, homeFor } from "./access";
import { AdminSessionProvider, useAdminSession } from "./session";
const items = [
  { to: "/", icon: LayoutDashboard, label: "admin.title" },
  {
    to: "/properties",
    icon: Building2,
    label: "adminConsole.areas.properties",
  },
  { to: "/users", icon: Users, label: "admin.users" },
  {
    to: "/reservations",
    icon: ClipboardList,
    label: "adminConsole.areas.reservations",
  },
  { to: "/payouts", icon: Wallet, label: "adminConsole.areas.payouts" },
  { to: "/reviews", icon: Star, label: "adminConsole.areas.reviews" },
  { to: "/support", icon: MessageSquare, label: "adminConsole.areas.support" },
  { to: "/content", icon: FileText, label: "adminConsole.areas.content" },
  { to: "/audit-logs", icon: ScrollText, label: "admin.audit" },
];
const utilities = [
  { to: "/access", icon: Shield, label: "console.access" },
  { to: "/settings", icon: SettingsIcon, label: "console.settings" },
];
function ConsoleLayout() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const authenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const {
    profile: user,
    preferences,
    loading,
    failed,
    reload,
  } = useAdminSession();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = getDirection(i18n.language);
  }, [i18n.language]);
  useEffect(() => setOpen(false), [location.pathname]);
  async function signOut() {
    const token = sessionStorageForAuth().getItem("manzil_refresh_token");
    dispatch(providerApi.util.resetApiState());
    dispatch(logout());
    if (token)
      try {
        await httpClient.post("/auth/logout", { refreshToken: token });
      } catch {
        /* Local session is already cleared. */
      }
  }
  if (!authenticated) return <Navigate to="/login" replace />;
  if (loading || !user)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
        {failed ? (
          <>
            <p role="alert">{t("admin.loadError")}</p>
            <Button onClick={() => void reload()}>{t("admin.retry")}</Button>
            <Button variant="ghost" onClick={() => void signOut()}>
              {t("admin.logout")}
            </Button>
          </>
        ) : (
          <p role="status">{t("common.loading")}</p>
        )}
      </div>
    );
  if (!platformRoles.includes(user.role))
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <Shield className="h-10 w-10 text-forest" />
        <h1 className="text-xl">{t("admin.accessDenied")}</h1>
        <p>{t("adminConsole.noConsoleAccess")}</p>
        <Button onClick={() => void signOut()}>{t("admin.logout")}</Button>
      </div>
    );
  if (!canAccess(user.role, location.pathname))
    return <Navigate to={homeFor(user.role)} replace />;
  const title = t(
    [...items, ...utilities].find((item) => item.to === location.pathname)
      ?.label ??
      (location.pathname === "/profile" ? "console.profile" : "admin.title"),
  );
  function links(list: typeof items) {
    return list
      .filter((item) => canAccess(user!.role, item.to))
      .map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `admin-nav-link ${isActive ? "is-active" : ""}`
          }
        >
          <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
          <span>{t(label)}</span>
        </NavLink>
      ));
  }
  function sidebar(mobile = false) {
    return (
      <>
        <div className="flex items-center justify-between gap-3 px-5 py-5">
          <BrandLogo />
          {mobile && (
            <Dialog.Close
              aria-label={t("admin.close")}
              className="admin-icon-button"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          )}
        </div>
        <p className="px-5 pb-5 text-xs font-medium uppercase tracking-wider text-muted">
          {t("admin.console")}
        </p>
        <nav
          aria-label={t("adminConsole.mainNavigation")}
          className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4"
        >
          {links(items)}
        </nav>
        <div className="shrink-0 space-y-3 border-t border-line p-3">
          <nav
            aria-label={t("adminConsole.accountNavigation")}
            className="space-y-1"
          >
            {links(utilities)}
          </nav>
          <div className="flex min-w-0 items-center gap-3 rounded-xl bg-paper p-3">
            <Avatar name={user!.name} image={user!.avatar} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {user!.name}
              </p>
              <p className="mt-1 truncate text-xs text-muted">
                {t(`admin.roles.${user!.role}`)}
              </p>
            </div>
          </div>
          <button
            className="admin-nav-link w-full text-start"
            onClick={() => void signOut()}
          >
            <LogOut aria-hidden="true" className="h-5 w-5" />
            {t("admin.logout")}
          </button>
        </div>
      </>
    );
  }
  return (
    <div
      dir={getDirection(i18n.language)}
      data-density={preferences.density}
      data-reduced-motion={preferences.reducedMotion}
      className="admin-shell"
    >
      <aside className="hidden w-64 shrink-0 flex-col border-e border-line bg-surface md:flex">
        {sidebar()}
      </aside>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/45 md:hidden" />
          <Dialog.Content
            dir={getDirection(i18n.language)}
            className="fixed inset-y-0 start-0 z-50 flex w-[min(20rem,88vw)] flex-col bg-surface shadow-xl md:hidden"
          >
            <Dialog.Title className="sr-only">
              {t("admin.console")}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              {t("adminConsole.mainNavigation")}
            </Dialog.Description>
            {sidebar(true)}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="admin-topbar">
          <div className="flex min-w-0 items-center gap-2">
            <button
              aria-label={t("adminConsole.openMenu")}
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="admin-icon-button md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="truncate text-base font-semibold sm:text-lg">
              {title}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link
              to="/profile"
              aria-label={t("adminConsole.openProfile")}
              title={t("console.profile")}
              className="rounded-full focus-visible:ring-2 focus-visible:ring-forest"
            >
              <Avatar name={user.name} image={user.avatar} />
            </Link>
          </div>
        </header>
        <main className="scroll-thin min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          <div className="admin-content">
            <Suspense
              fallback={
                <p role="status" className="p-4 text-sm text-muted">
                  {t("common.loading")}
                </p>
              }
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/views" element={<Navigate to="/" replace />} />
                <Route path="/profile" element={<Account />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/access" element={<Access />} />
                <Route path="/properties" element={<Properties />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/content" element={<Content />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route
                  path="/reservations"
                  element={<Operations area="reservations" />}
                />
                <Route
                  path="/payouts"
                  element={<Operations area="payouts" />}
                />
                <Route
                  path="/reviews"
                  element={<Operations area="reviews" />}
                />
                <Route
                  path="/support"
                  element={<Operations area="support" />}
                />
                <Route
                  path="*"
                  element={<Navigate to={homeFor(user.role)} replace />}
                />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
function Console() {
  return (
    <AdminSessionProvider>
      <ConsoleLayout />
    </AdminSessionProvider>
  );
}
export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Console />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}
