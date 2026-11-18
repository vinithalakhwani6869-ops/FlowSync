import type { ReactNode } from "react";
import {
  Activity,
  Clock,
  Database,
  EyeOff,
  GitBranch,
  Globe,
  Lock,
  RefreshCw,
  Search,
  Server,
  Settings,
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

function ComingSoonBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.6875rem] font-medium text-amber-700">
      Coming soon
    </span>
  );
}

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  comingSoon?: boolean;
}

const FEATURES: Feature[] = [
  {
    title: "Silent capture",
    description:
      "The Chrome and VS Code extensions log the pages you visit, time spent on each, the files you open, editor diagnostics and failed terminal commands — quietly in the background.",
    icon: Globe,
    color: "text-blue-600 bg-blue-50",
  },
  {
    title: "Live activity feed",
    description:
      "Watch events arrive in real time in Live Capture and step back through any day with the calendar picker.",
    icon: Activity,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    title: "Recovered sessions",
    description:
      "Past work rebuilt from your own activity, grouped by project and day, with a 30-minute inactivity gap splitting separate sessions.",
    icon: RefreshCw,
    color: "text-violet-600 bg-violet-50",
  },
  {
    title: "Error memory",
    description:
      "Recognise when you have seen an error before by matching it against your own captured history.",
    icon: Search,
    color: "text-amber-600 bg-amber-50",
    comingSoon: true,
  },
  {
    title: "AI fix suggestions",
    description:
      "Explain an error from your recent context and propose a fix as a diff you review and approve. Nothing is applied or run automatically, and it is off by default.",
    icon: Sparkles,
    color: "text-blue-600 bg-blue-50",
    comingSoon: true,
  },
  {
    title: "Welcome-back briefing",
    description:
      "After time away, a short summary of where you left off, what was failing and where to start.",
    icon: Timer,
    color: "text-violet-600 bg-violet-50",
    comingSoon: true,
  },
  {
    title: "Privacy controls",
    description:
      "Pause or resume capture, manage allowed browser domains, redact secrets from terminal output, and keep a retention window on stored events.",
    icon: Shield,
    color: "text-emerald-600 bg-emerald-50",
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
          Capture, recovery and privacy controls that work today. Cards marked
          “Coming soon” are not built yet.
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
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                {feature.comingSoon && <ComingSoonBadge />}
              </div>
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
      "Browser + IDE activity logged per session. Tabs, URLs, errors, terminal commands — everything recorded silently in the background.",
    icon: Activity,
    color: "text-blue-600 bg-blue-50",
  },
  {
    step: "02",
    title: "Link",
    description:
      "Correlated by timestamp and project context. FlowSync understands that the Stack Overflow tab and the VS Code error belong to the same session.",
    icon: GitBranch,
    color: "text-violet-600 bg-violet-50",
  },
  {
    step: "03",
    title: "Retrieve",
    description:
      "Relevant past context surfaced automatically when a similar error recurs. Not generated — reconstructed from your own history.",
    icon: RefreshCw,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    step: "04",
    title: "Fix",
    description:
      "When an error hits, FlowSync's AI uses your own history, including the docs you were reading, to explain it and propose a fix. You review the diff and approve. Nothing is applied or run without you.",
    icon: Sparkles,
    color: "text-amber-600 bg-amber-50",
    badge: "Coming soon",
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
          Three steps that connect your debugging journey, plus an AI fix step
          that is still in development.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                {item.badge && <ComingSoonBadge />}
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
  comingSoon?: boolean;
  body: ReactNode;
}

const PRIVACY_CARDS: PrivacyCard[] = [
  {
    title: "What is captured",
    icon: Globe,
    color: "text-blue-600 bg-blue-50",
    body: (
      <p>
        Chrome records the URL, page title and time spent on each allowed page.
        VS Code records file names and languages, editor diagnostics, failed
        terminal commands with their output, and how long a session stayed
        stuck.
      </p>
    ),
  },
  {
    title: "What is never captured",
    icon: EyeOff,
    color: "text-red-600 bg-red-100",
    body: (
      <>
        <p>
          Page content, form inputs, keystrokes, passwords and the contents of
          your files are not read or stored.
        </p>
        <p className="mt-3">
          Links shown in the app have their query parameters and fragments
          removed.
        </p>
      </>
    ),
  },
  {
    title: "Browser domain allowlist",
    icon: Shield,
    color: "text-emerald-600 bg-emerald-50",
    body: (
      <p>
        Chrome only records pages on your allowed developer domains. The list
        ships with common developer sites, and you can add or remove domains in
        Settings.
      </p>
    ),
  },
  {
    title: "Secret redaction",
    icon: Lock,
    color: "text-violet-600 bg-violet-50",
    body: (
      <p>
        The VS Code extension strips bearer tokens, common API keys, password
        values and long secret-like strings from terminal output and error text
        before it is stored. Redaction is on by default.
      </p>
    ),
  },
  {
    title: "Local storage and retention",
    icon: Database,
    color: "text-gray-600 bg-gray-100",
    body: (
      <p>
        Events are stored in the FlowSync backend database you run yourself.
        There is no cloud sync. A retention window — 30 days by default, set by
        the backend's <span className="font-mono text-xs">RETENTION_DAYS</span>{" "}
        — deletes older raw events.
      </p>
    ),
  },
  {
    title: "Access control",
    icon: Server,
    color: "text-amber-600 bg-amber-50",
    body: (
      <p>
        Writing events and reading settings, export and delete all require an
        API key. Cross-origin requests are limited to the origins you configure.
      </p>
    ),
  },
  {
    title: "AI and your data",
    icon: Sparkles,
    color: "text-blue-600 bg-blue-50",
    comingSoon: true,
    body: (
      <p>
        AI is off by default. When it ships and you enable it, an error's text,
        the trimmed code around it and recent activity titles would be sent to
        the AI provider only when you click a button for that request. Fixes are
        shown as a diff and never applied or run automatically. Secrets,{" "}
        <span className="font-mono text-xs">.env</span> files and ignored files
        are never sent.
      </p>
    ),
  },
  {
    title: "Your control",
    icon: Settings,
    color: "text-emerald-600 bg-emerald-50",
    body: (
      <p>
        Pause or resume capture and adjust capture toggles in Settings. Export
        every event as JSON or permanently delete all events from{" "}
        <span className="font-medium text-foreground">
          Settings → Cloud Sync
        </span>
        .
      </p>
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
          FlowSync is local-first. Here is what it records, where it goes, and
          what you control.
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
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="font-semibold text-foreground">{card.title}</h3>
                {card.comingSoon && <ComingSoonBadge />}
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
                {card.body}
              </div>
            </SectionCard>
          );
        })}
      </div>

      <div className="mt-6 max-w-3xl mx-auto border border-border rounded-2xl p-6 sm:p-8 text-center">
        <p className="text-foreground font-medium">
          FlowSync reconstructs work you already did — your own past activity,
          surfaced when you need it.
        </p>
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
