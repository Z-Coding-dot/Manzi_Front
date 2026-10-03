import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
// Send route templates only, excluding account/auth and personal identifiers.
export function PageViews() {
  const { pathname } = useLocation();
  const last = useRef("");
  useEffect(() => {
    if (last.current === pathname) return;
    last.current = pathname;
    if (/^\/(account|login|register|book|signup)(\/|$)/.test(pathname)) return;
    const path = pathname.startsWith("/property/")
      ? "/property/:slug"
      : pathname.startsWith("/kabul/")
        ? "/kabul/:area"
        : pathname;
    if (!/^\/(?:[a-z-]+|:[a-z]+|\/)*$/.test(path) || path.length > 80) return;
    const base = import.meta.env.VITE_API_URL ?? "/api/v1";
    void fetch(`${base}/analytics/page-view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);
  return null;
}
