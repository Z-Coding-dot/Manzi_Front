import { motion } from "framer-motion";
import {
  Award,
  Building2,
  DoorOpen,
  Home as HomeIcon,
  ShieldCheck,
  Sparkles,
  Tent,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { StepsSection } from "@/components/ui/StepsSection";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PropertyCard } from "@/components/ui/PropertyCard";
import { HeroSlider } from "@/components/ui/HeroSlider";
import { useGetPublishedPropertiesQuery } from "@/services/marketplaceApi";

const CATEGORY_ICONS: Record<string, typeof Building2> = {
  hotel: Building2,
  hostel: Users,
  dormitory: HomeIcon,
  guesthouse: Tent,
  room: DoorOpen,
  apartment: Building2,
};

export default function Home() {
  const { t } = useTranslation();
  const { data: properties = [], isLoading } = useGetPublishedPropertiesQuery();
  const featured = properties.filter((p) => p.rating >= 4.5).slice(0, 4);
  const categories = [
    "hotel",
    "hostel",
    "dormitory",
    "guesthouse",
    "room",
    "apartment",
  ] as const;
  const areas = Array.from(new Set(properties.map((p) => p.area))).slice(0, 4);

  return (
    <PublicLayout>
      <HeroSlider />

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2>{t("home.categoriesTitle")}</h2>
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {categories.map((cat, i) => {
            const Icon = CATEGORY_ICONS[cat];
            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <Link
                  to={`/search?type=${cat}`}
                  className="flex flex-col items-center gap-2 rounded-xl border border-line p-4 text-center hover:border-forest hover:bg-forest-soft/40"
                >
                  <Icon className="h-6 w-6 text-forest" />
                  <span className="text-xs font-medium text-ink">
                    {t(`categories.${cat}`)}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Popular areas */}
      <section className="bg-paper py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2>{t("home.popularAreasTitle")}</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {areas.map((area, i) => {
              const count = properties.filter((p) => p.area === area).length;
              const cover = properties.find((p) => p.area === area)?.images[0];
              return (
                <motion.div
                  key={area}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Link
                    to={`/search?location=${encodeURIComponent(area)}`}
                    className="group block overflow-hidden rounded-xl"
                  >
                    <div className="relative aspect-4/3">
                      {cover ? (
                        <img
                          src={cover}
                          alt={area}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full bg-forest-soft" />
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/0 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p className="font-medium text-white">{area}</p>
                        <p className="text-xs text-white/75">
                          {t("common.stayCount", { count })}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured properties */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex items-center justify-between">
          <h2>{t("home.featuredTitle")}</h2>
          <Link
            to="/search"
            className="text-sm font-medium text-forest hover:underline"
          >
            {t("common.seeAll")}
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {!isLoading &&
            featured.map((property, i) => (
              <PropertyCard key={property.id} property={property} index={i} />
            ))}
        </div>
      </section>

      <StepsSection />

      {/* Why use Manzil / trust */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center">{t("home.whyUseTitle")}</h2>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, key: "whyVerified" },
            { icon: Sparkles, key: "whyPricing" },
            { icon: Award, key: "whyLocal" },
          ].map(({ icon: Icon, key }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className="rounded-xl border border-line p-6"
            >
              <Icon className="h-6 w-6 text-forest" />
              <h3 className="mt-3 text-base">{t(`home.${key}Title`)}</h3>
              <p className="mt-2 text-sm text-muted">{t(`home.${key}Body`)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* For property owners CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-forest-deep p-8 sm:flex-row sm:items-center sm:p-12">
          <div>
            <h1 className="font-display text-2xl text-white sm:text-3xl">
              {t("home.forOwnersTitle")}
            </h1>
            <p className="mt-2 max-w-md text-sm text-white/75">
              {t("home.forOwnersSubtitle")}
            </p>
          </div>
          <Link to="/for-property-owners">
            <button className="whitespace-nowrap rounded-lg bg-white px-6 py-3 text-sm font-medium text-forest-deep hover:bg-white/90">
              {t("home.forOwnersCta")}
            </button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
