import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
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
} from "lucide-react";
import { store } from "@/redux/store";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { getDirection } from "@/i18n/config";
import { Button } from "@/components/ui/Button";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/admin/Dashboard";
import Properties from "./pages/admin/Properties";
import UsersPage from "./pages/admin/Users";
import AuditLogs from "./pages/admin/AuditLogs";
import Content from "./pages/admin/Content";
import Operations from "./pages/admin/Operations";
const items = [
  { to: "/", icon: LayoutDashboard, label: "admin.title" },
  { to: "/properties", icon: Building2, label: "admin.properties" },
  { to: "/users", icon: Users, label: "admin.users" },
  { to: "/reservations", icon: ClipboardList, label: "admin.reservations" },
  { to: "/payouts", icon: Wallet, label: "admin.payouts" },
  { to: "/reviews", icon: Star, label: "admin.reviews" },
  { to: "/support", icon: MessageSquare, label: "admin.support" },
  { to: "/content", icon: FileText, label: "admin.content" },
  { to: "/audit-logs", icon: ScrollText, label: "admin.audit" },
];
function Console() {
  const { t, i18n } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const authenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  if (!authenticated || !user) return <Navigate to="/login" replace />;
  if (!["admin", "super_admin"].includes(user.role))
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper">
        <Shield className="h-10 w-10 text-forest" />
        <h1>{t("admin.accessDenied")}</h1>
        <Button onClick={() => dispatch(logout())}>{t("admin.logout")}</Button>
      </div>
    );
  const title = t(
    items.find((i) => i.to === location.pathname)?.label ?? "admin.title",
  );
  return (
    <div
      dir={getDirection(i18n.language)}
      className="flex h-screen overflow-hidden bg-paper"
    >
      {open && (
        <button
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-ink/40 md:hidden"
        />
      )}
      <aside
        className={`${open ? "fixed inset-y-0 inset-s-0 z-50 flex" : "hidden"} w-60 shrink-0 flex-col border-e border-line bg-surface md:relative md:flex`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-forest text-sm font-bold text-white">
              M
            </div>
            <span className="text-lg font-semibold text-ink">
              {t("app.name")}
            </span>
          </div>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="px-5 pb-4 text-xs text-muted">{t("admin.console")}</p>
        <nav
          aria-label="Administration"
          className="flex-1 space-y-0.5 overflow-y-auto px-3"
        >
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${isActive ? "bg-forest-soft text-forest-deep" : "text-body hover:bg-paper"}`
              }
            >
              <Icon className="h-4 w-4" />
              {t(label)}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line px-3 py-3">
          <p className="truncate px-3 py-2 text-sm font-medium text-ink">
            {user.name}
          </p>
          <button
            onClick={() => dispatch(logout())}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-start text-sm text-body hover:bg-paper"
          >
            <LogOut className="h-4 w-4" />
            {t("admin.logout")}
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="rounded-md p-2 text-body hover:bg-paper md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="truncate text-base font-semibold text-ink sm:text-lg">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span
              aria-label={user.name}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-soft text-sm font-medium text-forest-deep"
            >
              {user.name[0]}
            </span>
          </div>
        </header>
        <main className="scroll-thin flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/content" element={<Content />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route
              path="/reservations"
              element={<Operations area="reservations" />}
            />
            <Route path="/payouts" element={<Operations area="payouts" />} />
            <Route path="/reviews" element={<Operations area="reviews" />} />
            <Route path="/support" element={<Operations area="support" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
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
