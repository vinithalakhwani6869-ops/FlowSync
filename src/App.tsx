import React, { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard, FolderOpen, Clock, Shield, Settings,
  ChevronRight, ExternalLink, Copy, Check, ArrowDown,
  Activity, Zap, Lock, Server, Database, GitBranch,
  Terminal, Globe, Code, FileText, AlertCircle,
  TrendingUp, Users, RefreshCw, CheckCircle2, XCircle,
  ToggleLeft, ToggleRight, Bell, Eye, EyeOff, Info,
  ArrowRight, Play, Pause, Search
} from "lucide-react";
import {
  connectEvents, fetchEvents, fetchStats, formatDuration,
  formatHours, formatRelative, formatTime,
} from "./lib/flowsync";
import type { FlowSyncEvent, FlowSyncStats } from "./lib/flowsync";

type Screen = "landing" | "dashboard" | "capture" | "vscode" | "timeline" | "privacy" | "settings" | "architecture";

const NAV_ITEMS: { id: Screen; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "capture", label: "Live Capture", icon: Activity },
  { id: "vscode", label: "VS Code Extension", icon: Code },
  { id: "timeline", label: "Recovered Sessions", icon: Clock },
  { id: "privacy", label: "Privacy Center", icon: Shield },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "architecture", label: "Architecture", icon: Server },
];

function Badge({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "green" | "yellow" | "gray" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium border rounded-full ${colors[color]}`}>
      {children}
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

// ─── LANDING ────────────────────────────────────────────────────────────────

function LandingScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { value: "83%", label: "Average recovery time reduced" },
    { value: "12,400+", label: "Recovered sessions" },
    { value: "3,200+", label: "Projects protected" },
    { value: "94.7%", label: "Retrieval accuracy" },
  ];

  const integrations = [
    { name: "VS Code", icon: "⬛" },
    { name: "Chrome", icon: "🌐" },
    { name: "GitHub", icon: "🐙" },
    { name: "Git", icon: "🔀" },
    { name: "Terminal", icon: "⌨️" },
    { name: "Markdown", icon: "📝" },
  ];

  return (
    <div className="min-h-screen bg-background font-['Inter',sans-serif]">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-8">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-semibold text-foreground text-[15px]">FlowSync</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              {["Features", "How It Works", "Privacy", "Pricing", "Docs"].map((item) => (
                <a key={item} href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {item}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5">
              Sign In
            </button>
            <button
              onClick={() => navigate("dashboard")}
              className="text-sm font-medium bg-primary text-white px-3 sm:px-4 py-2 min-h-11 sm:min-h-0 rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
            >
              Open Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Developer memory layer — not another AI assistant
            </div>
            <h1 className="text-[32px] md:text-[52px] font-bold text-foreground leading-[1.1] tracking-tight mb-6">
              FlowSync reconstructs the exact path that led to your fix —{" "}
              <span className="text-primary">automatically.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
              FlowSync silently connects your browser research, IDE activity, debugging sessions, and terminal history so you never rediscover the same solution twice.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("dashboard")}
                className="flex items-center justify-center w-full sm:w-auto gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200"
              >
                Open Dashboard
                <ArrowRight size={16} />
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center w-full sm:w-auto gap-2 bg-white border border-border text-foreground px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Globe size={16} />}
                Install Chrome Extension
              </button>
            </div>
          </div>

          {/* Flow diagram */}
          <div className="flex flex-col items-center gap-0">
            {[
              { label: "Chrome", sub: "Browsing activity captured", icon: Globe, color: "bg-blue-50 border-blue-200 text-blue-700" },
              null,
              { label: "FlowSync", sub: "Context correlated & stored", icon: Zap, color: "bg-primary border-primary text-white", highlight: true },
              null,
              { label: "VS Code", sub: "Error detected in real-time", icon: Code, color: "bg-blue-50 border-blue-200 text-blue-700" },
              null,
              { label: "Recovered Context", sub: "Session surfaced automatically", icon: CheckCircle2, color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
            ].map((item, i) => {
              if (!item) return (
                <div key={i} className="flex flex-col items-center py-1">
                  <div className="w-px h-6 bg-border" />
                  <ArrowDown size={14} className="text-muted-foreground" />
                  <div className="w-px h-6 bg-border" />
                </div>
              );
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className={`w-full max-w-xs md:w-80 border rounded-2xl px-5 py-4 flex items-center gap-4 ${item.highlight ? "bg-primary border-primary shadow-lg shadow-blue-200" : "bg-white border-border shadow-sm"}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.highlight ? "bg-white/20" : "bg-blue-50"}`}>
                    <Icon size={18} className={item.highlight ? "text-white" : "text-primary"} />
                  </div>
                  <div>
                    <div className={`font-semibold text-[15px] ${item.highlight ? "text-white" : "text-foreground"}`}>{item.label}</div>
                    <div className={`text-xs mt-0.5 ${item.highlight ? "text-blue-100" : "text-muted-foreground"}`}>{item.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-4 mt-12 pt-12 border-t border-border">
          {["Local-first", "Privacy-first", "VS Code Compatible", "Chrome Extension"].map((badge) => (
            <div key={badge} className="flex items-center gap-2 text-sm text-foreground">
              <CheckCircle2 size={16} className="text-emerald-500" />
              {badge}
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-y border-border py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl font-bold text-foreground mb-3">How FlowSync Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Three layers that connect your entire debugging journey, automatically.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Capture", desc: "Browser + IDE activity logged per session. Tabs, URLs, errors, terminal commands — everything recorded silently in the background.", icon: Activity, color: "text-blue-600 bg-blue-50" },
            { step: "02", title: "Link", desc: "Correlated by timestamp and project context. FlowSync understands that the Stack Overflow tab and the VS Code error belong to the same session.", icon: GitBranch, color: "text-violet-600 bg-violet-50" },
            { step: "03", title: "Retrieve", desc: "Relevant past context surfaced automatically when a similar error recurs. Not generated — reconstructed from your own history.", icon: RefreshCw, color: "text-emerald-600 bg-emerald-50" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.step} className="p-7 hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${item.color}`}>
                  <Icon size={20} />
                </div>
                <div className="text-xs font-semibold text-muted-foreground mb-2 tracking-widest uppercase">{item.step}</div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Integrations */}
      <section className="bg-white border-y border-border py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-8 uppercase tracking-widest">Works with your entire stack</p>
          <div className="flex flex-wrap justify-center gap-8">
            {integrations.map((int) => (
              <div key={int.name} className="flex items-center gap-2.5 text-foreground font-medium">
                <span className="text-xl">{int.icon}</span>
                <span className="text-sm">{int.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Stop rediscovering fixes you already know.</h2>
        <p className="text-lg text-muted-foreground mb-8">FlowSync remembers the path, so you can focus on the destination.</p>
        <button
          onClick={() => navigate("dashboard")}
          className="w-full sm:w-auto justify-center bg-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all hover:shadow-xl hover:shadow-blue-200 inline-flex items-center gap-2"
        >
          Open Dashboard 
          <ArrowRight size={18} />
        </button>
        <p className="text-xs text-muted-foreground mt-4">No account required. Local-first by default.</p>
      </section>
    </div>
  );
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────

function DashboardLayout({ children, navigate, active }: { children: React.ReactNode; navigate: (s: Screen) => void; active: Screen }) {
  return (
    <div className="flex h-screen flex-col md:flex-row bg-background font-['Inter',sans-serif] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-60 bg-white border-b md:border-b-0 md:border-r border-border flex md:flex-col items-center md:items-stretch flex-shrink-0">
        <div className="hidden md:flex h-16 items-center px-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-semibold text-foreground text-[15px]">FlowSync</span>
          </div>
        </div>
        <nav className="flex md:flex-col flex-1 md:p-3 md:space-y-0.5 items-center md:items-stretch gap-1 md:gap-0 px-2 py-1.5 overflow-x-auto md:overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-auto md:w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                  isActive ? "bg-blue-50 text-primary" : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="md:p-3 md:border-t md:border-border">
          <button
            onClick={() => navigate("landing")}
            className="w-auto md:w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-gray-50 hover:text-foreground transition-colors whitespace-nowrap flex-shrink-0"
          >
            <Globe size={16} />
            <span className="hidden md:inline">View Landing Page</span>
          </button>
        </div>
        <div className="hidden md:block p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">VL</div>
            <div>
              <div className="text-sm font-medium text-foreground">Vinitha L.</div>
              <div className="text-xs text-muted-foreground">Free plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function DashboardScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [stats, setStats] = useState<FlowSyncStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<FlowSyncEvent[]>([]);

  useEffect(() => {
    let disposed = false;
    void fetchStats().then((value) => {
      if (!disposed) setStats(value);
    });
    void fetchEvents(20).then((value) => {
      if (!disposed) setRecentEvents(value);
    });
    return () => {
      disposed = true;
    };
  }, []);

  const topSource =
    stats && Object.entries(stats.bySource).length > 0 ? Object.entries(stats.bySource)[0] : null;
  const topProjects = stats ? Object.entries(stats.projects).slice(0, 2).map(([name]) => name) : [];

  const overviewCards = [
    { label: "Contexts Recorded", value: stats ? String(stats.totalEvents) : "—", change: stats ? `+${stats.todayEvents} today` : "loading…", icon: RefreshCw, color: "text-primary bg-blue-50" },
    { label: "Hours Saved", value: stats ? formatHours(stats.dwellMs) : "—", change: stats ? `${Math.round(stats.dwellMs / 60000)} min of tracked activity` : "loading…", icon: Clock, color: "text-emerald-600 bg-emerald-50" },
    { label: "Pages Tracked", value: stats ? String(stats.distinctUrls) : "—", change: topSource ? `${topSource[0]} — ${topSource[1]} events` : "loading…", icon: TrendingUp, color: "text-violet-600 bg-violet-50" },
    { label: "Projects Active", value: stats ? String(Object.keys(stats.projects).length) : "—", change: topProjects.length > 0 ? topProjects.join(", ") : "loading…", icon: FolderOpen, color: "text-amber-600 bg-amber-50" },
  ];

  const recentSessions = recentEvents.slice(0, 4).map((event) => ({
    key: event.id,
    project: event.project,
    error: event.payload.title || event.payload.url || event.type,
    time: formatRelative(event.ts),
    visits: event.payload.visitCount ?? 0,
  }));

  const recentRetrievals = recentEvents
    .filter((event) => event.type === "tab.visit")
    .slice(0, 5)
    .map((event) => ({
      key: event.id,
      error: event.payload.title
        ? event.payload.title.slice(0, 32)
        : event.payload.url
          ? new URL(event.payload.url).hostname
          : "page visit",
      project: event.project,
      time: formatRelative(event.ts),
      visits: event.payload.visitCount ?? 0,
    }));

  return (
    <DashboardLayout navigate={navigate} active="dashboard">
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground mt-1">Here's what FlowSync captured today.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Capturing — Chrome active
            </div>
          </div>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {overviewCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className="p-5 hover:shadow-sm transition-shadow">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${card.color}`}>
                  <Icon size={16} />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{card.value}</div>
                <div className="text-sm font-medium text-foreground mb-1">{card.label}</div>
                <div className="text-xs text-muted-foreground">{card.change}</div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent sessions */}
          <div className="xl:col-span-2">
            <Card className="overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Recent Sessions</h2>
                <button onClick={() => navigate("timeline")} className="text-sm text-primary hover:underline flex items-center gap-1">
                  View all <ChevronRight size={14} />
                </button>
              </div>
              <div className="divide-y divide-border">
                {recentSessions.map((session) => (
                  <div key={session.key} className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 cursor-pointer transition-colors group" onClick={() => navigate("timeline")}>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors break-words">{session.project}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5 break-all">{session.error}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-semibold text-emerald-600">{session.visits} visits</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{session.time}</div>
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recent retrievals */}
          <div>
            <Card>
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Recent Retrievals</h2>
              </div>
              <div className="p-4 space-y-3">
                {recentRetrievals.map((r) => (
                  <div key={r.key} className="p-3 bg-background rounded-xl hover:bg-blue-50 cursor-pointer transition-colors group" onClick={() => navigate("timeline")}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="text-xs font-semibold text-foreground font-mono min-w-0 break-all">{r.error}</div>
                      <Badge color="blue" >{r.visits} visits</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{r.project}</div>
                    <div className="text-xs text-muted-foreground mt-1">{r.time}</div>
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5">
                <button
                  onClick={() => navigate("capture")}
                  className="w-full border border-border rounded-xl py-3 md:py-2.5 text-sm text-muted-foreground hover:bg-gray-50 hover:text-foreground transition-colors flex items-center justify-center gap-2"
                >
                  <Activity size={14} />
                  View Live Capture
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── LIVE CAPTURE ────────────────────────────────────────────────────────────

interface CaptureRow {
  id: string;
  source: string;
  detail: string;
  time: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  color: string;
}

function eventDetail(event: FlowSyncEvent): string {
  const title = event.payload.title || event.payload.url || "";
  if (event.type === "tab.dwell") {
    const dwell = event.payload.dwellTime ?? 0;
    return title ? `${title} — dwelled ${formatDuration(dwell)}` : `Dwelled ${formatDuration(dwell)}`;
  }
  if (event.type === "session.start") return "Chrome extension session started";
  if (event.type === "tab.visit") {
    const visits = event.payload.visitCount ?? 0;
    return title ? `${title} (visit ${visits})` : `Visited page (visit ${visits})`;
  }
  return title || event.type;
}

function toCaptureRow(event: FlowSyncEvent): CaptureRow {
  let icon: React.ComponentType<{ size?: number | string; className?: string }> = Globe;
  let color = "text-blue-600 bg-blue-50";
  if (event.type === "tab.dwell") {
    icon = Clock;
    color = "text-emerald-600 bg-emerald-50";
  } else if (event.type === "session.start") {
    icon = Activity;
    color = "text-amber-600 bg-amber-50";
  }
  return {
    id: event.id,
    source: "Chrome",
    detail: eventDetail(event),
    time: formatTime(event.ts),
    icon,
    color,
  };
}

function CaptureScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [isPaused, setIsPaused] = useState(false);
  const [rows, setRows] = useState<CaptureRow[]>([]);
  const [connected, setConnected] = useState(false);
  const [project, setProject] = useState("default");
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const pausedRef = useRef(isPaused);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    let disposed = false;
    const timer = setInterval(() => setNow(Date.now()), 1000);

    void fetchEvents(200).then((list) => {
      if (disposed) return;
      setRows(list.map(toCaptureRow));
      if (list.length > 0) {
        setProject(list[0].project);
        setSessionStart(list[list.length - 1].ts);
      }
    });

    const handle = connectEvents(
      (list) => {
        if (disposed) return;
        setRows(list.map(toCaptureRow));
        if (list.length > 0) {
          setProject(list[0].project);
          setSessionStart(list[list.length - 1].ts);
        }
      },
      (event) => {
        if (disposed || pausedRef.current) return;
        setRows((prev) => [toCaptureRow(event), ...prev].slice(0, 300));
      },
      (status) => {
        if (!disposed) setConnected(status);
      },
    );

    return () => {
      disposed = true;
      handle.close();
      clearInterval(timer);
    };
  }, []);

  const flowSteps = [
    { label: "Chrome Tabs", icon: Globe, active: rows.length > 0 },
    { label: "Browsing", icon: Search, active: rows.length > 0 },
    { label: "Pages Visited", icon: GitBranch, active: rows.length > 0 },
    { label: "Documentation", icon: FileText, active: rows.length > 0 },
    { label: "Context Signal", icon: Code, active: rows.length > 0 },
    { label: "Dwell Time", icon: Clock, active: rows.length > 0 },
    { label: "Context Captured", icon: CheckCircle2, active: rows.length > 0, final: true },
  ];

  const durationMs = sessionStart ? Math.max(0, now - sessionStart) : 0;
  const sessionInfo = [
    { label: "Project", value: project === "default" ? "Default" : project },
    { label: "Duration", value: formatDuration(durationMs) },
    { label: "Events captured", value: String(rows.length) },
    { label: "Connection", value: connected ? "Live" : "Reconnecting" },
    { label: "Status", value: isPaused ? "Paused" : "Session active" },
  ];

  return (
    <DashboardLayout navigate={navigate} active="capture">
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Live Capture</h1>
            <p className="text-muted-foreground mt-1">FlowSync is recording your current browsing context.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full">
              <div className={`w-1.5 h-1.5 rounded-full ${!connected || isPaused ? "bg-gray-400" : "bg-emerald-500 animate-pulse"}`} />
              {!connected ? "Reconnecting" : isPaused ? "Paused" : "Capturing"}
            </div>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center gap-2 border border-border bg-white text-sm font-medium text-foreground px-4 py-2 min-h-11 sm:min-h-0 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
              {isPaused ? "Resume" : "Pause"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Activity feed */}
          <div className="xl:col-span-2">
            <Card className="overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Activity Feed</h2>
                <Badge color="blue">{rows.length} events</Badge>
              </div>
              <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
                {rows.length === 0 ? (
                  <div className="px-4 sm:px-6 py-12 text-center text-sm text-muted-foreground">
                    No events yet — browse a page and FlowSync events will appear here live.
                  </div>
                ) : (
                  rows.map((row, i) => {
                    const RowIcon = row.icon;
                    return (
                      <div key={row.id} className="px-4 sm:px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-center gap-1 flex-shrink-0 w-14 sm:w-16 text-right">
                          <div className="text-xs font-mono text-muted-foreground">{row.time}</div>
                        </div>
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${row.color}`}>
                            <RowIcon size={14} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">{row.source}</div>
                            <div className="text-sm text-muted-foreground mt-0.5">{row.detail}</div>
                          </div>
                        </div>
                        {i === rows.length - 1 && connected && !isPaused && (
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0 mt-2" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Flow sidebar */}
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Capture Pipeline</h3>
              <div className="space-y-0">
                {flowSteps.map((step, i) => {
                  const Icon = step.icon;
                  const isLast = i === flowSteps.length - 1;
                  return (
                    <div key={step.label}>
                      <div className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors ${step.active ? (step.final ? "bg-emerald-50" : "bg-blue-50") : "bg-gray-50"}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${step.active ? (step.final ? "bg-emerald-100 text-emerald-600" : "bg-primary text-white") : "bg-gray-200 text-gray-400"}`}>
                          <Icon size={13} />
                        </div>
                        <span className={`text-sm font-medium ${step.active ? (step.final ? "text-emerald-700" : "text-primary") : "text-muted-foreground"}`}>
                          {step.label}
                        </span>
                        {step.active && <CheckCircle2 size={13} className={`ml-auto ${step.final ? "text-emerald-500" : "text-primary"}`} />}
                      </div>
                      {!isLast && (
                        <div className="ml-6 w-px h-3 bg-border" />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Session Info</h3>
              <dl className="space-y-3">
                {sessionInfo.map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <dt className="text-muted-foreground">{item.label}</dt>
                    <dd className="font-medium text-foreground text-right">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── VS CODE EXTENSION ───────────────────────────────────────────────────────

function VSCodeScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [showPanel, setShowPanel] = useState(true);

  return (
    <DashboardLayout navigate={navigate} active="vscode">
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">VS Code Extension</h1>
            <p className="text-muted-foreground mt-1">FlowSync surfaces recovered context directly inside your editor.</p>
          </div>
          <Badge color="blue">Hero Screen</Badge>
        </div>

        {/* VS Code mockup */}
        <div className="rounded-2xl overflow-x-auto md:overflow-hidden border border-gray-300 shadow-2xl shadow-gray-200">
          {/* Title bar */}
          <div className="bg-[#1e1e2e] px-4 py-2.5 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <div className="flex-1 text-center text-xs text-gray-400 font-mono">main.py — bug-fix-session — VS Code</div>
          </div>

          {/* Editor body */}
          <div className="bg-[#1e1e2e] flex min-w-[640px] md:min-w-0" style={{ height: "520px" }}>
            {/* File tree */}
            <div className="w-44 border-r border-[#2d2d3e] p-2 flex-shrink-0 bg-[#252535]">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest px-2 mb-2">Explorer</div>
              {["📁 ai-summarizer", "  📄 main.py", "  📄 utils.py", "  📄 config.py", "  📁 tests", "📁 models", "📄 requirements.txt"].map((f, i) => (
                <div key={i} className={`text-xs font-mono px-2 py-1 rounded cursor-pointer ${f.includes("main.py") ? "bg-[#2563EB]/30 text-blue-300" : "text-gray-400 hover:bg-[#2d2d3e]"}`}>
                  {f}
                </div>
              ))}
            </div>

            {/* Code area */}
            <div className="flex-1 flex flex-col">
              {/* Tabs */}
              <div className="flex bg-[#252535] border-b border-[#2d2d3e]">
                <div className="px-4 py-2 text-xs font-mono text-blue-300 bg-[#1e1e2e] border-r border-[#2d2d3e] border-t-2 border-t-blue-500">
                  main.py
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Code */}
                <div className="flex-1 p-5 overflow-auto">
                  <pre className="text-sm font-mono leading-7">
                    <span className="text-gray-500 mr-4">1</span><span className="text-gray-400"># AI Document Summarizer</span>{"\n"}
                    <span className="text-gray-500 mr-4">2</span>{"\n"}
                    <span className="text-gray-500 mr-4">3</span><span className="text-blue-400">from</span> <span className="text-gray-200">pathlib</span> <span className="text-blue-400">import</span> <span className="text-gray-200">Path</span>{"\n"}
                    <span className="text-gray-500 mr-4">4</span><span className="text-[#ff6b6b]">import requests</span>{"\n"}
                    <span className="text-gray-500 mr-4">5</span>{"\n"}
                    <span className="text-gray-500 mr-4">6</span><span className="text-blue-400">def</span> <span className="text-yellow-300">summarize</span><span className="text-gray-200">(file_path: Path) -&gt; str:</span>{"\n"}
                    <span className="text-gray-500 mr-4">7</span>{"    "}<span className="text-gray-400">"""Summarize document at path."""</span>{"\n"}
                    <span className="text-gray-500 mr-4">8</span>{"    "}<span className="text-gray-200">content</span> <span className="text-gray-400">=</span> <span className="text-gray-200">file_path.read_text()</span>{"\n"}
                    <span className="text-gray-500 mr-4">9</span>{"    "}<span className="text-blue-400">return</span> <span className="text-gray-200">requests.post(</span><span className="text-green-300">"/api/summarize"</span><span className="text-gray-200">, data=content)</span>
                  </pre>

                  {/* Error */}
                  <div className="mt-6 rounded-xl border border-[#ff6b6b]/30 bg-[#ff6b6b]/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={15} className="text-[#ff6b6b] flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[#ff6b6b] text-xs font-semibold font-mono mb-1">ModuleNotFoundError: No module named &apos;requests&apos;</div>
                        <div className="text-gray-400 text-xs font-mono">File "main.py", line 4, in &lt;module&gt;</div>
                        <div className="text-gray-500 text-xs font-mono ml-4">import requests</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FlowSync sidebar */}
                {showPanel && (
                  <div className="w-72 border-l border-[#2d2d3e] bg-[#252535] flex flex-col flex-shrink-0">
                    <div className="px-4 py-3 border-b border-[#2d2d3e] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                          <Zap size={11} className="text-white" />
                        </div>
                        <span className="text-xs font-semibold text-gray-200">FlowSync</span>
                      </div>
                      <button onClick={() => setShowPanel(false)} className="text-gray-500 hover:text-gray-300 text-xs">✕</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {/* Match badge */}
                      <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-emerald-400 mb-0.5">92%</div>
                        <div className="text-xs text-emerald-300">Match confidence</div>
                      </div>

                      {/* Session info */}
                      <div className="space-y-2">
                        <div className="text-[11px] uppercase tracking-widest text-gray-500">Matched Project</div>
                        <div className="text-sm font-medium text-gray-200">AI Document Summarizer</div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[11px] uppercase tracking-widest text-gray-500">Recovered Session</div>
                        <div className="text-sm font-medium text-gray-200">14 March 2026</div>
                      </div>

                      {/* Recovered knowledge */}
                      <div className="space-y-2">
                        <div className="text-[11px] uppercase tracking-widest text-gray-500">Recovered Knowledge</div>
                        <div className="space-y-1.5">
                          {[
                            "Stack Overflow",
                            "Python Docs",
                            "GitHub Issue #126",
                            "Terminal Commands",
                            "Personal Notes",
                            "Git Commit",
                          ].map((item) => (
                            <div key={item} className="flex items-center gap-2 text-xs text-gray-300">
                              <CheckCircle2 size={12} className="text-emerald-400 flex-shrink-0" />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recovery time */}
                      <div className="bg-[#1e1e2e] rounded-xl p-3 space-y-2">
                        <div className="text-[11px] uppercase tracking-widest text-gray-500">Estimated Recovery</div>
                        <div className="flex items-end justify-between">
                          <div>
                            <div className="text-xl font-bold text-blue-400">12s</div>
                            <div className="text-xs text-gray-500">with FlowSync</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-500 line-through">27 min</div>
                            <div className="text-xs text-gray-600">previously</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t border-[#2d2d3e]">
                      <button
                        onClick={() => navigate("timeline")}
                        className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-600 transition-colors"
                      >
                        Open Previous Session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* How FlowSync finds the match */}
        <Card className="p-6 mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">How FlowSync Finds the Match</h3>
          <div className="flex flex-wrap items-center gap-2">
            {["VS Code Error", "Timestamp", "Open Browser Tabs", "Project Name", "Embedding Similarity", "Relevant Session"].map((step, i, arr) => (
              <React.Fragment key={step}>
                <div
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${i === arr.length - 1 ? "bg-primary text-white" : "bg-background border border-border text-foreground"}`}
                >
                  {step}
                </div>
                {i < arr.length - 1 && <ArrowRight size={14} className="text-muted-foreground flex-shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// ─── TIMELINE ────────────────────────────────────────────────────────────────

function TimelineScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [copiedCmd, setCopiedCmd] = useState<number | null>(null);

  const events = [
    { time: "09:20", type: "search", icon: Search, color: "bg-blue-100 text-blue-700 border-blue-200", title: "Google Search", detail: "python requests module not found virtual environment", action: null },
    { time: "09:23", type: "so", icon: Globe, color: "bg-orange-100 text-orange-700 border-orange-200", title: "Stack Overflow", detail: "How to fix ModuleNotFoundError for requests in Python venv", action: { label: "Open link", type: "link" } },
    { time: "09:27", type: "github", icon: GitBranch, color: "bg-gray-100 text-gray-700 border-gray-200", title: "GitHub Issue #126", detail: "pip install fails silently when venv not activated", action: { label: "Open issue", type: "link" } },
    { time: "09:31", type: "docs", icon: FileText, color: "bg-yellow-100 text-yellow-700 border-yellow-200", title: "Python Documentation", detail: "venv — Creation of virtual environments (docs.python.org)", action: { label: "Open docs", type: "link" } },
    { time: "09:34", type: "terminal", icon: Terminal, color: "bg-emerald-100 text-emerald-700 border-emerald-200", title: "Terminal Command", detail: "pip install requests", isCode: true, action: { label: "Copy command", type: "copy", cmd: "pip install requests" } },
    { time: "09:36", type: "terminal", icon: Terminal, color: "bg-emerald-100 text-emerald-700 border-emerald-200", title: "Terminal Command", detail: "source venv/bin/activate && pip install requests", isCode: true, action: { label: "Copy command", type: "copy", cmd: "source venv/bin/activate && pip install requests" } },
    { time: "09:37", type: "git", icon: GitBranch, color: "bg-violet-100 text-violet-700 border-violet-200", title: "Git Commit", detail: "fix: activate venv before installing dependencies\n[ai-summarizer 3a7f21c]", action: null },
    { time: "09:38", type: "fix", icon: CheckCircle2, color: "bg-emerald-600 text-white border-emerald-600", title: "Bug Fixed", detail: "ModuleNotFoundError resolved. main.py running successfully.", action: null, isFinal: true },
  ];

  const handleCopy = (cmd: string, i: number) => {
    setCopiedCmd(i);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <DashboardLayout navigate={navigate} active="timeline">
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <button onClick={() => navigate("vscode")} className="text-sm text-primary hover:underline flex items-center gap-1">
                <ChevronRight size={14} className="rotate-180" /> VS Code Extension
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm text-foreground">Recovered Session</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Recovered Session Timeline</h1>
            <p className="text-muted-foreground mt-1">AI Document Summarizer — 14 March 2026 — ModuleNotFoundError</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge color="green">92% match</Badge>
            <button className="flex items-center gap-2 border border-border bg-white text-sm font-medium text-foreground px-4 py-2 min-h-11 sm:min-h-0 rounded-xl hover:bg-gray-50 transition-colors">
              <Copy size={14} /> Export session
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="space-y-0">
            {events.map((event, i) => {
              const Icon = event.icon;
              const isLast = i === events.length - 1;
              return (
                <div key={i} className="flex gap-4 sm:gap-6">
                  {/* Timeline spine */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center flex-shrink-0 ${event.color} ${event.isFinal ? "shadow-lg shadow-emerald-100" : ""}`}>
                      <Icon size={15} />
                    </div>
                    {!isLast && <div className="w-px flex-1 bg-border mt-1 mb-1 min-h-[2rem]" />}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-8 ${isLast ? "pb-0" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">{event.time}</span>
                          <span className={`text-sm font-semibold ${event.isFinal ? "text-emerald-600" : "text-foreground"}`}>{event.title}</span>
                        </div>
                        <div className={`text-sm ${event.isFinal ? "text-emerald-600 font-medium" : "text-muted-foreground"} ${event.isCode ? "font-mono bg-gray-100 px-3 py-2 rounded-lg text-xs mt-2 break-all" : "mt-0.5"}`}>
                          {event.detail}
                        </div>
                      </div>
                      {event.action && (
                        <button
                          onClick={() => event.action?.type === "copy" ? handleCopy(event.action.cmd!, i) : undefined}
                          className="flex items-center gap-1.5 text-xs font-medium text-primary bg-blue-50 border border-blue-200 px-3 py-3 sm:py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex-shrink-0 mt-1"
                        >
                          {event.action.type === "copy" ? (copiedCmd === i ? <Check size={12} /> : <Copy size={12} />) : <ExternalLink size={12} />}
                          {copiedCmd === i ? "Copied!" : event.action.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Developer insight */}
          <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <Info size={14} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">Developer Insight</div>
                <div className="text-sm text-muted-foreground italic">"Forgot to activate virtual environment before running pip install. The module installs globally instead of into the project venv."</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── PRIVACY ─────────────────────────────────────────────────────────────────

function PrivacyScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [cloudSync, setCloudSync] = useState(false);

  const principles = [
    { title: "Local Processing", desc: "All capture and retrieval runs on-device. Nothing leaves your machine by default.", icon: Server, color: "text-primary bg-blue-50" },
    { title: "Encrypted Storage", desc: "All session data is encrypted at rest using AES-256. Your SQLite database is protected.", icon: Lock, color: "text-violet-600 bg-violet-50" },
    { title: "No Raw Code Uploaded", desc: "Only metadata required for retrieval is ever synced. Source code never leaves your machine.", icon: Code, color: "text-amber-600 bg-amber-50" },
    { title: "Cloud Sync Disabled", desc: "Cloud sync is strictly opt-in. Turn it on only when you need cross-device continuity.", icon: Globe, color: "text-gray-600 bg-gray-100" },
  ];

  const privacyTimeline = [
    { time: "Today 09:34", event: "Session captured — AI Document Summarizer", stored: "Local", shared: "None" },
    { time: "Today 14:12", event: "Retrieval performed — Deepfake Detector", stored: "Local", shared: "None" },
    { time: "Yesterday", event: "Session exported (manual)", stored: "Local", shared: "Local file" },
    { time: "Jul 12", event: "Privacy audit — 0 issues found", stored: "—", shared: "—" },
  ];

  return (
    <DashboardLayout navigate={navigate} active="privacy">
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Privacy Center</h1>
            <p className="text-muted-foreground mt-1">Everything FlowSync knows about you — and how it stays on your machine.</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-2 min-h-11 sm:min-h-0 rounded-xl">
            <CheckCircle2 size={16} />
            Security health: Excellent
          </div>
        </div>

        {/* Principles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {principles.map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.title} className="p-6 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${p.color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <div className="font-semibold text-foreground mb-1">{p.title}</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">{p.desc}</div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Cloud sync toggle */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-foreground">Cloud Sync</h2>
              <Badge color={cloudSync ? "blue" : "gray"}>{cloudSync ? "Enabled" : "Disabled"}</Badge>
            </div>
            <div className="flex items-start gap-4 p-4 bg-background rounded-xl border border-border">
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground mb-1">Optional Cloud Sync</div>
                <div className="text-sm text-muted-foreground">Syncs only retrieval metadata across devices. Raw code and session content remain local only.</div>
              </div>
              <button
                onClick={() => setCloudSync(!cloudSync)}
                className={`relative w-11 h-6 rounded-full flex items-center transition-colors flex-shrink-0 mt-0.5 before:absolute before:-inset-2.5 before:content-[''] ${cloudSync ? "bg-primary justify-end" : "bg-gray-200 justify-start"}`}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow mx-0.5" />
              </button>
            </div>
            {cloudSync && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                Only embedding metadata will sync. No source code, no raw session content.
              </div>
            )}
          </Card>

          {/* Privacy timeline */}
          <Card className="overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Privacy Timeline</h2>
            </div>
            <div className="divide-y divide-border">
              {privacyTimeline.map((item) => (
                <div key={item.time} className="px-4 sm:px-6 py-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <div className="text-sm font-medium text-foreground min-w-0 break-words">{item.event}</div>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-3">{item.time}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <span className="text-xs text-muted-foreground">Stored: <span className="font-medium text-foreground">{item.stored}</span></span>
                    <span className="text-xs text-muted-foreground">Shared: <span className="font-medium text-foreground">{item.shared}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Trust statement */}
        <Card className="mt-6 p-6 md:p-8 bg-blue-50 border-blue-100 text-center">
          <div className="text-sm font-semibold text-primary mb-2 uppercase tracking-widest">Built on trust, not blind faith</div>
          <p className="text-foreground font-medium max-w-xl mx-auto">
            FlowSync only ever reconstructs things you already did — nothing to "trust," only to verify. Your own past work, surfaced when you need it.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

function SettingsScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [activeSection, setActiveSection] = useState("capture");
  const [notifications, setNotifications] = useState(true);
  const [autoCapture, setAutoCapture] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const sections = [
    { id: "capture", label: "Capture Preferences" },
    { id: "chrome", label: "Chrome Extension" },
    { id: "vscode", label: "VS Code Extension" },
    { id: "notifications", label: "Notifications" },
    { id: "embedding", label: "Embedding Settings" },
    { id: "models", label: "AI Models" },
    { id: "sync", label: "Cloud Sync" },
    { id: "appearance", label: "Appearance" },
    { id: "shortcuts", label: "Keyboard Shortcuts" },
  ];

  const shortcuts = [
    { action: "Open FlowSync panel", keys: ["⌘", "Shift", "F"] },
    { action: "Trigger manual capture", keys: ["⌘", "Shift", "C"] },
    { action: "Search sessions", keys: ["⌘", "K"] },
    { action: "Open timeline", keys: ["⌘", "Shift", "T"] },
    { action: "Copy last command", keys: ["⌘", "Shift", "X"] },
  ];

  return (
    <DashboardLayout navigate={navigate} active="settings">
      <div className="flex h-full flex-col md:flex-row">
        {/* Settings sidebar */}
        <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-border px-2 py-2 md:p-4 flex-shrink-0 overflow-x-auto">
          <div className="hidden md:block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-2">Settings</div>
          <nav className="flex md:flex-col items-center md:items-stretch gap-1 md:gap-0 md:space-y-0.5">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-auto md:w-full text-left whitespace-nowrap flex-shrink-0 px-3 py-3 md:py-2 rounded-xl text-sm transition-colors ${activeSection === s.id ? "bg-blue-50 text-primary font-medium" : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"}`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {activeSection === "capture" && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Capture Preferences</h2>
                <p className="text-sm text-muted-foreground">Control how FlowSync records your debugging activity.</p>
              </div>
              {[
                { label: "Auto-capture on error detection", desc: "Automatically begin a session when VS Code reports an error.", state: autoCapture, set: setAutoCapture },
                { label: "Capture terminal commands", desc: "Record terminal history during active debug sessions.", state: true, set: () => {} },
                { label: "Capture browser tabs", desc: "Log URLs visited while a VS Code error is active.", state: true, set: () => {} },
                { label: "Capture personal notes", desc: "Include notes created during a session.", state: false, set: () => {} },
              ].map((item) => (
                <Card key={item.label} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">{item.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => item.set(!item.state)}
                      className={`relative w-11 h-6 rounded-full flex items-center transition-colors flex-shrink-0 mt-0.5 before:absolute before:-inset-2.5 before:content-[''] ${item.state ? "bg-primary justify-end" : "bg-gray-200 justify-start"}`}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow mx-0.5" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeSection === "appearance" && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Appearance</h2>
                <p className="text-sm text-muted-foreground">Customize how FlowSync looks.</p>
              </div>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">Dark mode</div>
                    <div className="text-xs text-muted-foreground mt-1">Use dark theme in the dashboard.</div>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`relative w-11 h-6 rounded-full flex items-center transition-colors before:absolute before:-inset-2.5 before:content-[''] ${darkMode ? "bg-primary justify-end" : "bg-gray-200 justify-start"}`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow mx-0.5" />
                  </button>
                </div>
              </Card>
              <Card className="p-5">
                <div className="text-sm font-medium text-foreground mb-3">Font size</div>
                <div className="flex gap-2">
                  {["Small", "Medium", "Large"].map((size) => (
                    <button key={size} className={`flex-1 py-2 min-h-11 sm:min-h-0 rounded-xl text-sm border transition-colors ${size === "Medium" ? "border-primary bg-blue-50 text-primary font-medium" : "border-border text-muted-foreground hover:border-gray-300"}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeSection === "shortcuts" && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Keyboard Shortcuts</h2>
                <p className="text-sm text-muted-foreground">All FlowSync shortcuts. Click to customize.</p>
              </div>
              <Card className="overflow-hidden">
                <div className="divide-y divide-border">
                  {shortcuts.map((s) => (
                    <div key={s.action} className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between hover:bg-gray-50 cursor-pointer group">
                      <div className="text-sm text-foreground">{s.action}</div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {s.keys.map((k, i) => (
                          <span key={i} className="text-xs font-mono bg-gray-100 border border-gray-200 text-foreground px-2 py-1 rounded-lg">{k}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {!["capture", "appearance", "shortcuts"].includes(activeSection) && (
            <div className="max-w-xl">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">{sections.find(s => s.id === activeSection)?.label}</h2>
                <p className="text-sm text-muted-foreground mb-6">Configure this section to match your workflow.</p>
              </div>
              <Card className="p-8 text-center">
                <div className="text-4xl mb-3">⚙️</div>
                <div className="text-sm text-muted-foreground">Settings for this section are coming in the next release.</div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── ARCHITECTURE ────────────────────────────────────────────────────────────

function ArchitectureScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const nodes = [
    { id: "chrome", label: "Chrome Extension", sub: "Captures tabs, URLs, dwell time during sessions", icon: Globe, color: "bg-blue-50 border-blue-200 text-blue-700", badge: "Input" },
    { id: "vscode", label: "VS Code Extension", sub: "Captures open files, error output, terminal context", icon: Code, color: "bg-violet-50 border-violet-200 text-violet-700", badge: "Input" },
    { id: "fastapi", label: "FastAPI Backend", sub: "Correlates browser and code activity by timestamp and project context", icon: Server, color: "bg-amber-50 border-amber-200 text-amber-700", badge: "Processing" },
    { id: "embedding", label: "Embedding Engine", sub: "Turns each session into a searchable semantic representation", icon: Zap, color: "bg-primary border-primary text-white", badge: "Core", highlight: true },
    { id: "sqlite", label: "SQLite / IndexedDB", sub: "Stores everything local-first, on-device by default", icon: Database, color: "bg-gray-100 border-gray-300 text-gray-700", badge: "Storage" },
    { id: "retrieval", label: "Context Retrieval", sub: "Surfaces the relevant past session automatically when needed", icon: RefreshCw, color: "bg-emerald-50 border-emerald-200 text-emerald-700", badge: "Output" },
  ];

  return (
    <DashboardLayout navigate={navigate} active="architecture">
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">System Architecture</h1>
            <p className="text-muted-foreground mt-1">How the components hand off context, end to end.</p>
          </div>
        </div>

        {/* Architecture diagram */}
        <div className="max-w-2xl mx-auto">
          {/* Input layer */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center mb-4">Input Layer</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {nodes.slice(0, 2).map((node) => {
                const Icon = node.icon;
                return (
                  <Card key={node.id} className={`p-5 border-2 ${node.color} ${node.highlight ? "" : "bg-card border-border"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${node.highlight ? "bg-white/20" : "bg-blue-50"}`}>
                        <Icon size={16} className={node.highlight ? "text-white" : "text-primary"} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="text-sm font-semibold text-foreground">{node.label}</div>
                          <Badge color="gray">{node.badge}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed break-words">{node.sub}</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Arrow down */}
          <div className="flex justify-center items-center gap-2 py-3">
            <div className="w-px h-8 bg-border" />
          </div>
          <div className="flex justify-center mb-3">
            <ArrowDown size={16} className="text-muted-foreground" />
          </div>

          {/* Processing */}
          {nodes.slice(2, 4).map((node, i) => {
            const Icon = node.icon;
            return (
              <div key={node.id}>
                <Card className={`p-5 mb-3 ${node.highlight ? "bg-primary border-primary" : ""}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${node.highlight ? "bg-white/20" : "bg-amber-50"}`}>
                      <Icon size={18} className={node.highlight ? "text-white" : "text-amber-600"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className={`font-semibold ${node.highlight ? "text-white" : "text-foreground"}`}>{node.label}</div>
                        <Badge color={node.highlight ? "blue" : "yellow"}>{node.badge}</Badge>
                      </div>
                      <div className={`text-sm ${node.highlight ? "text-blue-100" : "text-muted-foreground"} break-words`}>{node.sub}</div>
                    </div>
                  </div>
                </Card>
                {i < 1 && (
                  <div className="flex flex-col items-center py-1">
                    <div className="w-px h-4 bg-border" />
                    <ArrowDown size={14} className="text-muted-foreground" />
                    <div className="w-px h-4 bg-border" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Arrow down */}
          <div className="flex flex-col items-center py-1 mb-3">
            <div className="w-px h-4 bg-border" />
            <ArrowDown size={14} className="text-muted-foreground" />
            <div className="w-px h-4 bg-border" />
          </div>

          {/* Storage + Output */}
          {nodes.slice(4).map((node, i) => {
            const Icon = node.icon;
            return (
              <div key={node.id}>
                <Card className="p-5 mb-3">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${node.id === "retrieval" ? "bg-emerald-100" : "bg-gray-100"}`}>
                      <Icon size={18} className={node.id === "retrieval" ? "text-emerald-600" : "text-gray-600"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="font-semibold text-foreground">{node.label}</div>
                        <Badge color={node.id === "retrieval" ? "green" : "gray"}>{node.badge}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground break-words">{node.sub}</div>
                    </div>
                  </div>
                </Card>
                {i < nodes.slice(4).length - 1 && (
                  <div className="flex flex-col items-center py-1 mb-3">
                    <div className="w-px h-4 bg-border" />
                    <ArrowDown size={14} className="text-muted-foreground" />
                    <div className="w-px h-4 bg-border" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tech stack */}
        <div className="max-w-2xl mx-auto mt-8">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Technology Stack</h3>
            <div className="flex flex-wrap gap-2">
              {["Python 3.12", "FastAPI", "SQLite", "IndexedDB", "sentence-transformers", "Manifest V3", "VS Code Extension API", "TypeScript", "React"].map((tech) => (
                <span key={tech} className="bg-background border border-border text-foreground text-xs font-medium px-3 py-1.5 rounded-lg font-mono">
                  {tech}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");

  const navigate = (s: Screen) => setScreen(s);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} className="size-full">
      {screen === "landing" && <LandingScreen navigate={navigate} />}
      {screen === "dashboard" && <DashboardScreen navigate={navigate} />}
      {screen === "capture" && <CaptureScreen navigate={navigate} />}
      {screen === "vscode" && <VSCodeScreen navigate={navigate} />}
      {screen === "timeline" && <TimelineScreen navigate={navigate} />}
      {screen === "privacy" && <PrivacyScreen navigate={navigate} />}
      {screen === "settings" && <SettingsScreen navigate={navigate} />}
      {screen === "architecture" && <ArchitectureScreen navigate={navigate} />}
    </div>
  );
}
