import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { Logo } from "../../components/ui/Logo";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { TagGlyph } from "./TagGlyph";
import {
  AnalyticsIcon,
  AssetsIcon,
  AuditsIcon,
  BookingsIcon,
  CategoriesIcon,
  MaintenanceIcon,
  ReportsIcon,
  RequestsIcon,
  SettingsIcon,
} from "../../components/icons";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#plans", label: "Plans" },
  { href: "#faq", label: "FAQ" },
];

// Real, verifiable properties of the system - not marketing filler. Every
// line here corresponds to something actually enforced in the backend.
const TRUST_POINTS = [
  {
    title: "Isolation between organizations",
    copy: "Every query is scoped to your organization from the signed-in session — never from a value the client sends.",
  },
  {
    title: "Every action, logged",
    copy: "Who did what, when, and from where — allocations, transfers, approvals, and edits all write to an audit trail you can read.",
  },
  {
    title: "Approval chains, not overrides",
    copy: "Allocation requests move through department and manager sign-off in order. No step can be skipped from the UI.",
  },
  {
    title: "A tag for every asset",
    copy: "Each asset gets a sequential tag and a QR code the moment it's registered — no spreadsheets, no manual numbering.",
  },
];

const FAQS = [
  {
    q: "Can employees in different organizations see each other's data?",
    a: "No. Every organization's departments, assets, bookings, and history are isolated at the database query level, derived from the signed-in user's session — not from anything the browser sends.",
  },
  {
    q: "Who can approve an asset request?",
    a: "Requests go to the requester's department head first, then to an asset manager, who assigns the specific asset. Either step can reject the request; neither can be skipped.",
  },
  {
    q: "What happens when an asset is due for maintenance?",
    a: "Anyone can raise a maintenance ticket against an asset. Once approved, the asset's status changes to Maintenance and it can't be allocated again until it's resolved.",
  },
  {
    q: "Do I need a credit card to start?",
    a: "No. The Free plan covers a single team getting organized, with no card required. You can move to Pro or Enterprise when you outgrow it.",
  },
  {
    q: "Can I export my data?",
    a: "Yes — every report (assets, departments, maintenance, bookings, audits) exports to CSV, Excel, or PDF from inside the app.",
  },
];

const FEATURES = [
  {
    icon: AssetsIcon,
    name: "Asset Management",
    copy: "Register assets, generate QR tags, and track status from day one to disposal.",
  },
  {
    icon: CategoriesIcon,
    name: "Asset Categories",
    copy: "Custom fields per category, so a vehicle and a laptop don't share a form.",
  },
  {
    icon: RequestsIcon,
    name: "Allocation Requests",
    copy: "Employee request, department head approval, manager sign-off — every hand-off logged.",
  },
  {
    icon: BookingsIcon,
    name: "Resource Booking",
    copy: "Meeting rooms, vehicles, and equipment, booked without double-booking.",
  },
  {
    icon: MaintenanceIcon,
    name: "Maintenance",
    copy: "Raise a ticket, assign a technician, track it through to resolved.",
  },
  {
    icon: AuditsIcon,
    name: "Audits",
    copy: "Run a cycle count, flag what's missing or damaged, close it out.",
  },
  {
    icon: ReportsIcon,
    name: "Reports",
    copy: "Export any view to CSV, Excel, or PDF in one click.",
  },
  {
    icon: AnalyticsIcon,
    name: "Analytics",
    copy: "Utilization, trends, and department performance, charted automatically.",
  },
  {
    icon: SettingsIcon,
    name: "Settings",
    copy: "Asset tag prefixes, approval rules, and branding, per organization.",
  },
];

const ROLES = [
  { name: "Super Admin", copy: "Creates organizations, suspends accounts, watches platform-wide usage." },
  { name: "Organization Admin", copy: "Manages departments, employees, categories, and org-wide settings." },
  { name: "Asset Manager", copy: "Registers and allocates assets, approves maintenance, manages bookings." },
  { name: "Department Head", copy: "Approves requests from their team, books shared resources." },
  { name: "Employee", copy: "Requests assets, raises maintenance tickets, books rooms and equipment." },
];

const STEPS = [
  { tag: "01 · REGISTER", copy: "Add an asset and it gets a tag and a QR code automatically." },
  { tag: "02 · ALLOCATE", copy: "Requests flow through department and manager approval before anything changes hands." },
  { tag: "03 · TRACK", copy: "Every transfer, booking, and repair is logged to the asset's history." },
  { tag: "04 · AUDIT", copy: "Run a cycle count against the live register and close out discrepancies." },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    tagline: "For a single team getting organized.",
    features: ["Up to 50 assets", "Core modules: assets, allocation, bookings", "Email notifications"],
  },
  {
    name: "Pro",
    price: "Contact us",
    tagline: "For teams that need the full picture.",
    features: ["Everything in Free", "Unlimited assets", "Analytics & report exports", "Cloudinary-backed file storage"],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Contact us",
    tagline: "For organizations with compliance needs.",
    features: ["Everything in Pro", "Multi-department audit cycles", "Priority support", "Custom branding"],
  },
];

function NavBar() {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-paper/85 backdrop-blur dark:border-slate-800/70 dark:bg-night/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-ink dark:hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden text-sm font-medium text-slate-600 hover:text-ink dark:text-slate-300 dark:hover:text-white sm:block"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="rounded-md bg-tag-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-tag-700"
              >
                Start free
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" className="h-5 w-5">
              {menuOpen ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 5.5h14M3 10h14M3 14.5h14" />}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-paper px-4 py-4 dark:border-slate-800 dark:bg-night md:hidden">
          <nav className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-2 py-2.5 hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-800 dark:hover:text-white"
              >
                {link.label}
              </a>
            ))}
            {!isAuthenticated && (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-2 py-2.5 hover:bg-slate-100 hover:text-ink dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Sign in
              </Link>
            )}
          </nav>
          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Appearance</span>
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  const { isAuthenticated } = useAuth();
  return (
    <section className="relative overflow-hidden">
      <div
        className="bg-blueprint pointer-events-none absolute inset-0 text-brand-900/[0.05] dark:text-brand-300/[0.06]"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
        <div>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-brand-700 dark:text-brand-400">
            Multi-tenant asset &amp; resource management
          </p>
          <h1 className="mt-4 max-w-xl font-display text-5xl font-semibold leading-[1.05] text-ink dark:text-white sm:text-6xl">
            Every asset,{" "}
            <span className="italic text-brand-700 dark:text-brand-400">tagged</span> and accounted for.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            AssetFlow tracks equipment, rooms, and vehicles from registration to retirement — allocation, bookings,
            maintenance, and audits, all in one system your whole team can see.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="rounded-md bg-tag-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-tag-700"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="rounded-md bg-tag-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-tag-700"
                >
                  Start free
                </Link>
                <Link
                  to="/login"
                  className="rounded-md border border-slate-300 px-6 py-3 text-base font-medium text-ink transition-colors hover:bg-white dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
          <dl className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-mist pt-6 dark:border-brand-900/60">
            {[
              ["9", "Integrated modules"],
              ["5", "Role types, one login"],
              ["100%", "Actions logged to history"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-mono text-2xl font-semibold tabular-nums text-ink dark:text-white">{value}</dd>
                <dd className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The one characteristic object in this product's world: a
            registered asset, tagged, with its status visible at a glance. */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-brand-600/5 dark:bg-brand-400/5" aria-hidden="true" />
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-slate-400">Asset tag</p>
                <p className="font-mono text-lg font-semibold text-ink dark:text-white">AST-00142</p>
              </div>
              <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-800 dark:bg-brand-900/40 dark:text-brand-300">
                Allocated
              </span>
            </div>
            <div className="mt-5 flex items-center gap-4 border-t border-dashed border-mist pt-5 dark:border-slate-700">
              <TagGlyph className="h-16 w-16 shrink-0 text-ink dark:text-white" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink dark:text-white">Dell Latitude 5420</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">IT Equipment · Engineering</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Held by Priya Nair since Mar 12</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-dashed border-mist pt-5 dark:border-slate-700">
              <div>
                <p className="text-xs text-slate-400">Utilization</p>
                <p className="font-mono text-lg font-semibold tabular-nums text-ink dark:text-white">74%</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Open tickets</p>
                <p className="font-mono text-lg font-semibold tabular-nums text-ink dark:text-white">3</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-brand-700 dark:text-brand-400">
      {children}
    </p>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionEyebrow>Not just a spreadsheet</SectionEyebrow>
        <h2 className="mt-3 max-w-xl font-display text-2xl font-semibold text-ink dark:text-white sm:text-3xl">
          Four things that are actually true.
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map((t) => (
            <div key={t.title}>
              <p className="text-sm font-semibold text-ink dark:text-white">{t.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{t.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <SectionEyebrow>What's inside</SectionEyebrow>
      <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold text-ink dark:text-white sm:text-4xl">
        Nine modules, one register of truth.
      </h2>
      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.name}
            className="rounded-lg border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <f.icon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <p className="mt-3 text-sm font-semibold text-ink dark:text-white">{f.name}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Roles() {
  return (
    <section className="divider-perforated mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionEyebrow>Built for every seat</SectionEyebrow>
      <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold text-ink dark:text-white sm:text-4xl">
        Five roles. One login each.
      </h2>
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {ROLES.map((r) => (
          <div key={r.name} className="rounded-lg bg-mist/40 p-5 dark:bg-slate-800/50">
            <p className="text-sm font-semibold text-ink dark:text-white">{r.name}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{r.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="divider-perforated mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <SectionEyebrow>The lifecycle</SectionEyebrow>
      <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold text-ink dark:text-white sm:text-4xl">
        From registration to the next cycle count.
      </h2>
      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <div key={s.tag}>
            <p className="font-mono text-xs font-semibold tracking-wider text-tag-700 dark:text-tag-400">{s.tag}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{s.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Plans() {
  return (
    <section id="plans" className="divider-perforated mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <SectionEyebrow>Plans</SectionEyebrow>
      <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold text-ink dark:text-white sm:text-4xl">
        Start free. Grow into it.
      </h2>
      <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-xl border p-6 ${
              plan.featured
                ? "border-brand-600 bg-white shadow-lg dark:bg-slate-900"
                : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            }`}
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {plan.name}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink dark:text-white">{plan.price}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{plan.tagline}</p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className={`mt-6 rounded-md px-4 py-2.5 text-center text-sm font-medium transition-colors ${
                plan.featured
                  ? "bg-brand-600 text-white hover:bg-brand-700"
                  : "border border-slate-300 text-ink hover:bg-slate-50 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
              }`}
            >
              {plan.name === "Free" ? "Start free" : "Talk to us"}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 py-4 dark:border-slate-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="text-sm font-semibold text-ink dark:text-white">{q}</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-45" : ""}`}
          aria-hidden="true"
        >
          <path d="M10 4v12M4 10h12" />
        </svg>
      </button>
      {open && <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{a}</p>}
    </div>
  );
}

function Faq() {
  return (
    <section id="faq" className="divider-perforated mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <SectionEyebrow>Questions</SectionEyebrow>
      <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold text-ink dark:text-white sm:text-4xl">
        Before you ask.
      </h2>
      <div className="mt-10 max-w-2xl">
        {FAQS.map((f) => (
          <FaqItem key={f.q} q={f.q} a={f.a} />
        ))}
      </div>
    </section>
  );
}

function ClosingCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <div className="bg-blueprint relative overflow-hidden rounded-2xl bg-ink px-8 py-14 text-center text-brand-100/[0.08] dark:bg-slate-900">
        <div className="relative">
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            Ready to tag your first asset?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-slate-300">
            Create an organization, invite your team, and register your first asset in a few minutes.
          </p>
          <Link
            to="/signup"
            className="mt-8 inline-block rounded-md bg-tag-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-tag-700"
          >
            Start free
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:justify-between sm:px-6">
        <Logo />
        <p>Built for teams that track what they own.</p>
        <p>&copy; {new Date().getFullYear()} AssetFlow</p>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-night dark:text-white">
      <NavBar />
      <Hero />
      <TrustBar />
      <Features />
      <Roles />
      <HowItWorks />
      <Plans />
      <Faq />
      <ClosingCta />
      <Footer />
    </div>
  );
}
