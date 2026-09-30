import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  DoorOpen,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

import { PublicLayout } from "@/components/layout/PublicLayout";

const STEPS = [
  {
    icon: ClipboardCheck,
    title: "Create your owner account",
    body: "Register once, then open the Provider dashboard with your real account.",
  },
  {
    icon: DoorOpen,
    title: "Add your property and rooms",
    body: "Enter the details, room inventory, prices, and house policies that guests need.",
  },
  {
    icon: ShieldCheck,
    title: "Submit for verification",
    body: "Our team reviews the listing before it becomes visible to travelers.",
  },
];

export default function ProviderOnboardingInfo() {
  return (
    <PublicLayout>
      <section className="bg-forest">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/70">
            Manzil Provider
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl text-white sm:text-6xl">
            Bring your Kabul property online.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">
            Set up your property in a few focused steps, keep managing it
            offline when needed, and reach travelers looking for a verified
            stay.
          </p>
          <a
            href={`${import.meta.env.VITE_PROVIDER_URL ?? "http://localhost:5174"}/signup`}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-forest-deep hover:bg-white/90"
          >
            Start provider onboarding
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-xl border border-line p-6">
              <Icon className="h-6 w-6 text-forest" />
              <h2 className="mt-5 text-lg text-ink">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </article>
          ))}
        </div>
        <div className="mt-10 flex items-start gap-3 rounded-xl border border-line bg-paper p-5 text-sm text-muted">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-forest" />
          <p>
            Marketplace visibility comes from the backend verification status,
            not from a frontend-only toggle.
          </p>
        </div>
        <p className="mt-8 text-sm text-muted">
          Already have an owner account?{" "}
          <a
            className="font-medium text-forest hover:underline"
            href={`${import.meta.env.VITE_PROVIDER_URL ?? "http://localhost:5174"}/login`}
          >
            Open the Provider dashboard
          </a>
          <span className="sr-only"> or </span>
          <Link className="sr-only" to="/provider-onboarding-info">
            Provider onboarding information
          </Link>
        </p>
      </section>
    </PublicLayout>
  );
}
