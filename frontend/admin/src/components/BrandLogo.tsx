import { useTranslation } from "react-i18next";
export default function BrandLogo({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <span className="flex items-center gap-2">
      <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white">
        <img
          src="/Manzil_Logo.webp"
          alt={compact ? t("app.name") : ""}
          className="absolute left-1/2 top-[-19px] w-[180px] max-w-none -translate-x-1/2"
        />
      </span>
      {!compact && (
        <span className="text-xl font-semibold">{t("app.name")}</span>
      )}
    </span>
  );
}
