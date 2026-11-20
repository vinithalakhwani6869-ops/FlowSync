import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
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
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={`bg-card border border-border rounded-2xl cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 ${className}`}
    >
      {children}
    </div>
  );
}

interface CardDetail {
  title: string;
  intro: string;
  lines: string[];
  comingSoon?: boolean;
}

function CardDetailDialog({
  detail,
  onClose,
}: {
  detail: CardDetail | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={detail !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      {detail && (
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border-border shadow-lg focus:outline-none [&>button]:focus:ring-neutral-400">
          <DialogHeader className="pr-8 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <DialogTitle>{detail.title}</DialogTitle>
              {detail.comingSoon && <ComingSoonBadge />}
            </div>
            <DialogDescription>{detail.intro}</DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {detail.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </DialogContent>
      )}
    </Dialog>
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
  intro: string;
  details: string[];
  icon: LucideIcon;
  color: string;
  comingSoon?: boolean;
}

const FEATURES: Feature[] = [
  {
    title: "Silent capture",
    description:
      "The Chrome and VS Code extensions log the pages you visit, time spent on each, the files you open, editor diagnostics and failed terminal commands — quietly in the background.",
    intro: "Both extensions capture context in the background.",
    details: [
      "Chrome records the URL, page title, time spent and visit count on allowed domains.",
      "VS Code records file names, languages, editor diagnostics and failed terminal commands.",
      "Events are buffered locally and synced to your FlowSync backend with an API key.",
      "Capture can be paused in Settings.",
    ],
    icon: Globe,
    color: "text-blue-600 bg-blue-50",
  },
  {
    title: "Live activity feed",
    description:
      "Watch events arrive in real time in Live Capture and step back through any day with the calendar picker.",
    intro: "Live Capture shows events as they arrive.",
    details: [
      "The feed connects to the backend over a WebSocket.",
      "Chrome and VS Code events appear in one timestamped list.",
      "Source badges distinguish Chrome from VS Code.",
      "The date picker lets you step back through previous days.",
    ],
    icon: Activity,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    title: "Recovered sessions",
    description:
      "Past work rebuilt from your own activity, grouped by project and day, with a 30-minute inactivity gap splitting separate sessions.",
    intro: "Recovered Sessions rebuild past work from stored events.",
    details: [
      "Events are grouped by project and local day.",
      "A gap of more than 30 minutes starts a new session.",
      "Open a session to see its captured events in order.",
      "Export is available from the Recovered Sessions screen.",
    ],
    icon: RefreshCw,
    color: "text-violet-600 bg-violet-50",
  },
  {
    title: "Error memory",
    description:
      "Recognise when you have seen an error before by matching it against your own captured history.",
    intro: "Matching an error against your own history is planned, not built yet.",
    details: [
      "This card is marked Coming soon.",
      "No matching engine or semantic index is implemented today.",
      "Current history is reconstructed from stored events by project, day and time.",
      "Nothing is diagnosed automatically by an AI model.",
    ],
    icon: Search,
    color: "text-amber-600 bg-amber-50",
    comingSoon: true,
  },
  {
    title: "AI fix suggestions",
    description:
      "Coming soon: FlowSync will spot an error and ask if you want help. Say yes and it will work out a fix from your own history. You will review every change before it is applied.",
    intro: "The AI fix flow is planned and marked Coming soon.",
    details: [
      "FlowSync will notice an error and ask whether you want help.",
      "Only after you say yes will it work from your own history, including docs you were reading.",
      "Nothing will be sent before you approve.",
      "You will review the proposed changes before anything is applied or run.",
      "Your own captured history is the input.",
    ],
    icon: Sparkles,
    color: "text-blue-600 bg-blue-50",
    comingSoon: true,
  },
  {
    title: "Welcome-back briefing",
    description:
      "After time away, a short summary of where you left off, what was failing and where to start.",
    intro: "A short summary after time away is planned.",
    details: [
      "This card is marked Coming soon.",
      "No briefing generator is implemented today.",
      "Current history is available as Recovered Sessions grouped by project and day.",
      "No AI model is configured or called.",
    ],
    icon: Timer,
    color: "text-violet-600 bg-violet-50",
    comingSoon: true,
  },
  {
    title: "Privacy controls",
    description:
      "Pause or resume capture, manage allowed browser domains, redact secrets from terminal output, and keep a retention window on stored events.",
    intro: "Capture and storage controls are available in Settings.",
    details: [
      "Pause or resume capture.",
      "Manage the Chrome domain allowlist.",
      "Secret redaction is on by default.",
      "Retention is set by the backend's RETENTION_DAYS value.",
    ],
    icon: Shield,
    color: "text-emerald-600 bg-emerald-50",
  },
];

export function FeatureSection() {
  const [detail, setDetail] = useState<CardDetail | null>(null);

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
              onClick={() => setDetail({
                title: feature.title,
                intro: feature.intro,
                lines: feature.details,
                comingSoon: feature.comingSoon,
              })}
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
      <CardDetailDialog detail={detail} onClose={() => setDetail(null)} />
    </section>
  );
}

const HOW_IT_WORKS_STEPS: (Feature & { step: string; badge?: string })[] = [
  {
    step: "01",
    title: "Capture",
    description:
      "Browser + IDE activity logged per session. Tabs, URLs, errors, terminal commands — everything recorded silently in the background.",
    intro: "Two extensions feed one event store.",
    details: [
      "Chrome records allowed-page URLs, titles and dwell time.",
      "VS Code records files, diagnostics and failed terminal commands.",
      "Each event is timestamped and tagged with its source.",
      "Capture can be paused in Settings.",
    ],
    icon: Activity,
    color: "text-blue-600 bg-blue-50",
  },
  {
    step: "02",
    title: "Link",
    description:
      "Correlated by timestamp and project context. FlowSync understands that the Stack Overflow tab and the VS Code error belong to the same session.",
    intro: "Events are correlated by stored metadata.",
    details: [
      "Each event has a timestamp, project and source.",
      "Recovered Sessions groups events by project and local day.",
      "A 30-minute inactivity gap separates sessions.",
      "No semantic matching engine is running today.",
    ],
    icon: GitBranch,
    color: "text-violet-600 bg-violet-50",
  },
  {
    step: "03",
    title: "Retrieve",
    description:
      "Relevant past context surfaced automatically when a similar error recurs. Not generated — reconstructed from your own history.",
    intro: "Past activity is reconstructed from stored events.",
    details: [
      "Open Recovered Sessions to browse grouped past work.",
      "Live Capture also supports stepping back through a previous day.",
      "Content comes from captured URLs, files and errors, not generated text.",
      "Similar-error matching is not implemented today.",
    ],
    icon: RefreshCw,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    step: "04",
    title: "Fix",
    description:
      "Coming soon: FlowSync will notice an error and ask if you want help. Say yes and it will work from your own history. You will review every change before it is applied.",
    intro: "The AI fix flow is planned and marked Coming soon.",
    details: [
      "FlowSync will notice an error and ask whether you want help.",
      "Only after you say yes will it work from your own history, including docs you were reading.",
      "Nothing will be sent before you approve.",
      "You will review the proposed changes before anything is applied or run.",
      "Your own captured history is the input.",
    ],
    icon: Sparkles,
    color: "text-amber-600 bg-amber-50",
    badge: "Coming soon",
  },
];

export function HowItWorksSection() {
  const [detail, setDetail] = useState<CardDetail | null>(null);

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
              onClick={() => setDetail({
                title: `${item.step} · ${item.title}`,
                intro: item.intro,
                lines: item.details,
                comingSoon: Boolean(item.badge),
              })}
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
      <CardDetailDialog detail={detail} onClose={() => setDetail(null)} />
    </section>
  );
}

interface PrivacyCard {
  title: string;
  icon: LucideIcon;
  color: string;
  comingSoon?: boolean;
  intro: string;
  details: string[];
  body: ReactNode;
}

const PRIVACY_CARDS: PrivacyCard[] = [
  {
    title: "What is captured",
    icon: Globe,
    color: "text-blue-600 bg-blue-50",
    intro: "The extensions store event metadata, not page or file contents.",
    details: [
      "Chrome records allowed-page URLs, titles and time spent.",
      "VS Code records file names, languages and error diagnostics.",
      "Failed terminal commands and their output are recorded.",
      "Stuck-session duration is recorded when errors stay unresolved.",
    ],
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
    intro: "Content and credentials are excluded from capture.",
    details: [
      "Page content and form inputs are not read or stored.",
      "Keystrokes and passwords are not captured.",
      "File contents are not read or stored.",
      "Link query parameters and fragments are removed in the app.",
    ],
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
    intro: "Chrome capture is limited to domains you allow.",
    details: [
      "Chrome only records pages on allowed developer domains.",
      "A default list of common developer sites ships with the app.",
      "You can add or remove domains in Settings.",
      "Events are only posted for allowed pages.",
    ],
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
    intro: "Sensitive strings are stripped before events are stored.",
    details: [
      "Bearer tokens and common API keys are stripped from terminal output.",
      "Password values and long secret-like strings are removed.",
      "Redaction is on by default.",
      "The setting is available under VS Code options.",
    ],
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
    intro: "Events live in the backend database you run yourself.",
    details: [
      "Events are stored in the FlowSync backend database you run yourself.",
      "Cloud sync is off and marked Coming soon.",
      "The backend deletes raw events older than the retention window.",
      "The default retention window is 30 days.",
    ],
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
    intro: "Write and data-control endpoints require an API key.",
    details: [
      "Writing events requires the API key.",
      "Reading settings requires the API key.",
      "Export and delete-all require the API key.",
      "Cross-origin requests are limited to configured origins.",
    ],
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
    intro: "The AI fix flow is planned; no AI model is called today.",
    details: [
      "No AI model is called today and no provider is configured.",
      "FlowSync will notice an error and ask whether you want help.",
      "Only after you say yes will it use your own history, including docs you were reading.",
      "Nothing will be sent before you approve.",
      "You will review proposed changes before anything is applied or run.",
    ],
    body: (
      <p>
        Coming soon: no AI model is called today. FlowSync will notice an error
        and ask whether you want help. Only after you say yes will it use your
        own history, including docs you were reading. Nothing will be sent before
        you approve, and you will review proposed changes before anything is
        applied or run.
      </p>
    ),
  },
  {
    title: "Your control",
    icon: Settings,
    color: "text-emerald-600 bg-emerald-50",
    intro: "Capture and stored data are controlled from Settings.",
    details: [
      "Pause or resume capture in Settings.",
      "Adjust capture toggles and allowed domains.",
      "Export every event as JSON.",
      "Permanently delete all events from Settings → Cloud Sync.",
    ],
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
  const [detail, setDetail] = useState<CardDetail | null>(null);

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
            <SectionCard
              key={card.title}
              className="p-6"
              onClick={() => setDetail({
                title: card.title,
                intro: card.intro,
                lines: card.details,
                comingSoon: card.comingSoon,
              })}
            >
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

      <CardDetailDialog detail={detail} onClose={() => setDetail(null)} />

      <div className="mt-6 max-w-3xl mx-auto border border-border rounded-2xl p-6 sm:p-8 text-center">
        <p className="text-foreground font-medium">
          FlowSync reconstructs work you already did - your own past activity,
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
