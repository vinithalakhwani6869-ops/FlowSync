import type { ReactNode } from "react";
import {
  Activity,
  Clock,
  Code,
  Database,
  GitBranch,
  Globe,
  LayoutDashboard,
  Lock,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
  Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

function SectionCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-card border border-border rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const FEATURES: Feature[] = [
  {
    title: "Silent browser capture",
    description:
      "The Chrome extension records the URL, page title, dwell time and visit count for tabs on the domains you allow. Everything runs in the background.",
    icon: Globe,
    color: "text-blue-600 bg-blue-50",
  },
  {
    title: "Editor capture",
    description:
      "The VS Code extension records the files you open, error diagnostics, failed terminal commands with their output, and how long you stayed stuck.",
    icon: Code,
    color: "text-violet-600 bg-violet-50",
  },
  {
    title: "Recovered sessions",
    description:
      "Captured events are grouped into sessions by project and day, with a 30-minute inactivity gap. Replay the pages, files and errors in order.",
    icon: RefreshCw,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    title: "Stuck detection",
    description:
      "If you stop working while an error is still unresolved, FlowSync records a stuck-session event after the idle threshold you set (4 minutes by default).",
    icon: Timer,
    color: "text-amber-600 bg-amber-50",
  },
  {
    title: "Secret redaction",
    description:
      "Tokens, API keys and password values are stripped from captured error and command text before it reaches your backend. Redaction is on by default.",
    icon: Lock,
    color: "text-red-600 bg-red-100",
  },
  {
    title: "Local storage",
    description:
      "Captured events go to the FlowSync backend you run yourself, in a local SQLite database. There is no cloud sync and no third-party event service.",
    icon: Database,
    color: "text-gray-600 bg-gray-100",
  },
  {
    title: "Your data controls",
    description:
      "Pause capture, add or remove allowed browser domains, see the backend retention window, and export or delete every event from Settings.",
    icon: Shield,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    title: "Dashboard and live feed",
    description:
      "See capture stats, active projects, recent sessions and recent pages in the dashboard, plus a live event feed in Live Capture. Error events can also raise in-app toasts.",
    icon: LayoutDashboard,
    color: "text-violet-600 bg-violet-50",
  },
];

export function FeatureSection() {
  return (
    <section
      id="features"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 scroll-mt-20"
    >
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          What FlowSync does
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Concrete capture and recovery features that are working today. No
          model provider is required.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <SectionCard
              key={feature.title}
              className="p-6 hover:shadow-md transition-shadow"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${feature.color}`}
              >
                <Icon size={20} />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </SectionCard>
          );
        })}
      </div>
    </section>
  );
}

const HOW_IT_WORKS_STEPS: (Feature & { step: string; badge?: string })[] = [
  {
    step: "01",
    title: "Capture",
    description:
      "Browser + IDE activity logged per session. Tabs, URLs, errors and terminal commands are recorded silently in the background.",
    icon: Activity,
    color: "text-blue-600 bg-blue-50",
  },
  {
    step: "02",
    title: "Link",
    description:
      "Grouped by timestamp, project and day. Pages, files and errors from the same work session are kept together.",
    icon: GitBranch,
    color: "text-violet-600 bg-violet-50",
  },
  {
    step: "03",
    title: "Retrieve",
    description:
      "Your own past sessions, rebuilt from captured events. See the pages, files and errors that led to a fix — not generated content.",
    icon: RefreshCw,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    step: "04",
    title: "Assist",
    description:
      "Planned: use your history and the pages you were reading to propose a fix as a diff you approve.",
    icon: Sparkles,
    color: "text-amber-600 bg-amber-50",
    badge: "Not available yet",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 scroll-mt-20"
    >
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          How FlowSync Works
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Three layers that connect your debugging journey, plus an assist step
          that is still in development.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {HOW_IT_WORKS_STEPS.map((item) => {
          const Icon = item.icon;
          return (
            <SectionCard
              key={item.step}
              className="p-7 hover:shadow-md transition-shadow"
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${item.color}`}
              >
                <Icon size={20} />
              </div>
              <div className="text-xs font-semibold text-muted-foreground mb-2 tracking-widest uppercase">
                {item.step}
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <h3 className="text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                {item.badge && (
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.6875rem] font-medium text-amber-700">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </SectionCard>
          );
        })}
      </div>
    </section>
  );
}

interface PrivacyCard {
  title: string;
  icon: LucideIcon;
  color: string;
  body: ReactNode;
}

const PRIVACY_CARDS: PrivacyCard[] = [
  {
    title: "What is captured",
    icon: Globe,
    color: "text-blue-600 bg-blue-50",
    body: (
      <>
        <p>
          Chrome records the URL, page title, dwell time and visit count — only
          for domains on your allowed list. VS Code records file names,
          language, error messages, failed command text, terminal output and
          stuck-session timing.
        </p>
        <p className="mt-3 text-foreground font-medium">Never captured:</p>
        <p>
          Page content, form inputs, keystrokes, passwords, or the contents of
          your source files.
        </p>
      </>
    ),
  },
  {
    title: "Where data is stored",
    icon: Database,
    color: "text-gray-600 bg-gray-100",
    body: (
      <p>
        Events are written to a SQLite database on the FlowSync backend you run
        yourself (<span className="font-mono text-xs">backend/data/flowsync.db</span>).
        Cloud sync does not exist, and captured events are not sent to a
        third-party service.
      </p>
    ),
  },
  {
    title: "Secret redaction",
    icon: Lock,
    color: "text-violet-600 bg-violet-50",
    body: (
      <p>
        With <span className="font-medium text-foreground">Redact secrets</span>{" "}
        on (the default), the VS Code extension strips bearer tokens, common API
        keys, password values, and long hex or base64-like strings from error
        and command text before it is sent to your backend.
      </p>
    ),
  },
  {
    title: "Retention",
    icon: Clock,
    color: "text-emerald-600 bg-emerald-50",
    body: (
      <p>
        The backend deletes events older than{" "}
        <span className="font-mono text-xs">RETENTION_DAYS</span>, which defaults
        to 30 days. Cleanup runs once every 24 hours.
      </p>
    ),
  },
  {
    title: "AI and your data",
    icon: Server,
    color: "text-amber-600 bg-amber-50",
    body: (
      <p>
        No AI model is called. Generation is off, no provider is configured, and
        captured events are not sent to a model provider.
      </p>
    ),
  },
  {
    title: "Your control",
    icon: Shield,
    color: "text-emerald-600 bg-emerald-50",
    body: (
      <>
        <p>
          Pause capture, manage allowed browser domains, and toggle redaction in
          Settings. Export every event as JSON or permanently delete all events
          from{" "}
          <span className="font-medium text-foreground">
            Settings → Cloud Sync
          </span>
          .
        </p>
        <p className="mt-3">
          FlowSync never edits your code or runs a command on its own.
        </p>
      </>
    ),
  },
];

export function PrivacySection() {
  return (
    <section
      id="privacy"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 scroll-mt-20"
    >
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-3xl font-bold text-foreground mb-3">Privacy</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          FlowSync is local-first. Here is exactly what it records, where it
          goes, and what you can control.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRIVACY_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <SectionCard key={card.title} className="p-6">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${card.color}`}
              >
                <Icon size={18} />
              </div>
              <h3 className="font-semibold text-foreground mb-2">
                {card.title}
              </h3>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
                {card.body}
              </div>
            </SectionCard>
          );
        })}
      </div>
    </section>
  );
}

export function ComingSoonSection({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return (
    <section
      id={id}
      className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 scroll-mt-20"
    >
      <div className="max-w-2xl mx-auto text-center border border-dashed border-border rounded-2xl p-8 sm:p-12">
        <h2 className="text-3xl font-bold text-foreground mb-3">{title}</h2>
        <p className="text-muted-foreground">Coming soon.</p>
      </div>
    </section>
  );
}
