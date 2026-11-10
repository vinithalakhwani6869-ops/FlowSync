import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard, FolderOpen, Clock, Shield, Settings,
  ChevronRight, ChevronDown, ExternalLink, Copy, Check, ArrowDown,
  Activity, Zap, Lock, Server, Database, GitBranch,
  Terminal, Globe, Code, FileText, AlertCircle,
  TrendingUp, Users, RefreshCw, CheckCircle2, XCircle,
  ToggleLeft, ToggleRight, Bell, Eye, EyeOff, Info,
  ArrowRight, Play, Pause, Search, LogOut
} from "lucide-react";
import {
  connectEvents, fetchEvents, fetchStats, formatDuration,
  formatHours, formatIdle, formatRelative, formatTime,
  fetchSettings, updateSettings, fetchMeta, exportData, deleteAllData, downloadJson,
} from "./lib/flowsync";
import type {
  FlowSyncEvent, FlowSyncStats, LiveConnectionStatus,
  FlowSyncSettings, SettingsPatch, FlowSyncMeta,
} from "./lib/flowsync";
import { Toaster, toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Calendar } from "./components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { AuthDialog } from "./components/auth/auth-dialog";
import { useAuthSession } from "./lib/auth";
import { supabase } from "./lib/supabase";

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
  const [authOpen, setAuthOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { user, loading: authLoading } = useAuthSession();
  const userEmail = user?.email ?? "";
  const userInitial = (userEmail || "?").charAt(0).toUpperCase();

  useEffect(() => {
    if (authOpen && user) setAuthOpen(false);
  }, [authOpen, user]);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    if (!supabase || signingOut) return;
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (error) {
      toast.error("Could not log out", { description: error.message });
    }
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
              <span className="font-semibold text-foreground text-[0.9375rem]">FlowSync</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              {["Features", "How It Works", "Privacy", "Pricing", "Docs"].map((item) => (
                <a key={item} href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {item}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {authLoading ? (
              <div
                aria-hidden="true"
                className="h-9 w-16 animate-pulse rounded-lg bg-muted sm:w-28"
              />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label={`Account menu for ${userEmail}`}
                    className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-white px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-gray-50 sm:min-h-0"
                  >
                    <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                      {userInitial}
                    </span>
                    <span className="hidden max-w-[10rem] truncate sm:inline">
                      {userEmail}
                    </span>
                    <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{userEmail}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate("dashboard")}>
                    <LayoutDashboard className="size-4" />
                    Open Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={signingOut}
                    onSelect={(event) => {
                      event.preventDefault();
                      void handleLogout();
                    }}
                  >
                    <LogOut className="size-4" />
                    {signingOut ? "Logging out…" : "Log out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="min-h-11 whitespace-nowrap px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:min-h-0 sm:px-3"
              >
                <span className="sm:hidden">Log in</span>
                <span className="hidden sm:inline">Log in / Sign up</span>
              </button>
            )}
            <button
              onClick={() => navigate("dashboard")}
              className="text-sm font-medium bg-primary text-white px-3 sm:px-4 py-2 min-h-11 sm:min-h-0 rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
            >
              Open Dashboard
            </button>
          </div>
        </div>
      </header>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-12 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Developer memory layer — not another AI assistant
            </div>
            <h1 className="text-[2rem] md:text-[3.25rem] font-bold text-foreground leading-[1.1] tracking-tight mb-6">
              FlowSync reconstructs the exact path that led to your fix -{" "}
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
                    <div className={`font-semibold text-[0.9375rem] ${item.highlight ? "text-white" : "text-foreground"}`}>{item.label}</div>
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
            <span className="font-semibold text-foreground text-[0.9375rem]">FlowSync</span>
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

type RowIcon = React.ComponentType<{ size?: number | string; className?: string }>;

interface CaptureRow {
  id: string;
  type: string;
  project: string;
  ts: number;
  source: string;
  sourceName: string;
  sourceColor: string;
  title: string;
  detail?: string;
  time: string;
  icon: RowIcon;
  color: string;
}

function shortenText(text: string, max = 90): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  return singleLine.length > max ? `${singleLine.slice(0, max - 1)}…` : singleLine;
}

function prettyEventType(type: string): string {
  const label = type.replace(/[._-]+/g, " ").trim();
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : "Event";
}

function eventHostPath(url?: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
    return `${parsed.hostname}${path}`;
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function sanitizeVisitUrl(url?: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    parsed.search = "";
    parsed.hash = "";
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

function eventDisplay(event: FlowSyncEvent): { title: string; detail?: string } {
  const payload = event.payload;
  const page = eventHostPath(payload.url) || payload.title || "";
  switch (event.type) {
    case "tab.visit":
      return {
        title: page ? `Visited ${page}` : "Visited a page",
        detail: payload.title && payload.title !== page ? payload.title : undefined,
      };
    case "tab.dwell":
      return {
        title: page
          ? `Spent ${formatDuration(payload.dwellTime ?? 0)} on ${page}`
          : `Spent ${formatDuration(payload.dwellTime ?? 0)} on a page`,
        detail: payload.title && payload.title !== page ? payload.title : undefined,
      };
    case "file.opened":
      return {
        title: `Opened ${payload.fileName || "a file"}`,
        detail: payload.language ? `${payload.language} file` : undefined,
      };
    case "terminal.error": {
      const command = payload.command?.trim();
      const error = (payload.errorMessage || payload.terminalOutput || "").trim();
      return {
        title: command ? `Command failed: ${shortenText(command, 70)}` : "Terminal command failed",
        detail: error ? shortenText(error, 220) : "Command exited with a non-zero code",
      };
    }
    case "diagnostic.error":
      return {
        title: `Error in ${payload.fileName || "a file"}`,
        detail: payload.errorMessage ? shortenText(payload.errorMessage, 220) : "Unresolved error diagnostic",
      };
    case "developer.stuck": {
      const reason = payload.errorMessage || payload.terminalOutput || "";
      return {
        title: reason ? `Stuck — ${shortenText(reason, 80)}` : "Stuck with unresolved errors",
        detail: payload.stuckDuration
          ? `No activity for ${formatDuration(payload.stuckDuration)}`
          : payload.fileName
            ? payload.fileName
            : undefined,
      };
    }
    case "context.switching":
      return {
        title: "Switched context rapidly",
        detail: payload.fileName ? `Now in ${payload.fileName}` : undefined,
      };
    case "session.start":
      return { title: "Capture session started", detail: "Extension connected" };
    default:
      return {
        title: prettyEventType(event.type),
        detail: payload.title || payload.url || payload.errorMessage || payload.fileName || undefined,
      };
  }
}

function sourceVisual(source: string): { name: string; color: string } {
  if (source === "vscode") {
    return { name: "VS Code", color: "text-violet-700 bg-violet-50 border-violet-200" };
  }
  if (source === "chrome") {
    return { name: "Chrome", color: "text-blue-700 bg-blue-50 border-blue-200" };
  }
  return {
    name: source ? source.charAt(0).toUpperCase() + source.slice(1) : "Unknown",
    color: "text-gray-600 bg-gray-100 border-gray-200",
  };
}

function eventVisual(event: FlowSyncEvent): { icon: RowIcon; color: string } {
  if (event.source === "vscode") {
    return { icon: Code, color: "text-violet-600 bg-violet-50" };
  }
  switch (event.type) {
    case "tab.dwell":
      return { icon: Clock, color: "text-emerald-600 bg-emerald-50" };
    case "session.start":
      return { icon: Activity, color: "text-amber-600 bg-amber-50" };
    default:
      return { icon: Globe, color: "text-blue-600 bg-blue-50" };
  }
}

function timelineVisual(event: FlowSyncEvent): { icon: RowIcon; color: string } {
  switch (event.type) {
    case "terminal.error":
      return { icon: Terminal, color: "bg-red-100 text-red-700 border-red-200" };
    case "diagnostic.error":
      return { icon: AlertCircle, color: "bg-red-100 text-red-700 border-red-200" };
    case "developer.stuck":
      return { icon: Clock, color: "bg-amber-100 text-amber-700 border-amber-200" };
    case "file.opened":
      return { icon: FileText, color: "bg-violet-100 text-violet-700 border-violet-200" };
    case "context.switching":
      return { icon: GitBranch, color: "bg-amber-100 text-amber-700 border-amber-200" };
    default:
      return { icon: Globe, color: "bg-blue-100 text-blue-700 border-blue-200" };
  }
}

function eventKey(event: FlowSyncEvent): string {
  if (event.id) return event.id;
  return `${event.type}|${event.project}|${event.source}|${event.ts}|${JSON.stringify(event.payload)}`;
}

function dedupeEvents(events: FlowSyncEvent[]): FlowSyncEvent[] {
  const byKey = new Map<string, FlowSyncEvent>();
  for (const event of events) {
    const key = eventKey(event);
    const existing = byKey.get(key);
    if (!existing || event.ts >= existing.ts) byKey.set(key, event);
  }
  return [...byKey.values()];
}

function mergeEvents(...lists: FlowSyncEvent[][]): FlowSyncEvent[] {
  return dedupeEvents(lists.flat());
}

function countVisitsByUrl(events: FlowSyncEvent[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (event.type !== "tab.visit" || !event.payload.url) continue;
    const key = sanitizeVisitUrl(event.payload.url);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function toCaptureRow(event: FlowSyncEvent, visitCounts: Map<string, number>): CaptureRow {
  const display = eventDisplay(event);
  const source = sourceVisual(event.source);
  const visual = eventVisual(event);
  let detail = display.detail;
  if (event.type === "tab.visit") {
    const key = sanitizeVisitUrl(event.payload.url);
    const count = key ? (visitCounts.get(key) ?? 0) : (event.payload.visitCount ?? 0);
    const visits = `${count} visit${count === 1 ? "" : "s"}`;
    detail = detail ? `${visits} · ${detail}` : visits;
  }
  return {
    id: eventKey(event),
    type: event.type,
    project: event.project,
    ts: event.ts,
    source: event.source,
    sourceName: source.name,
    sourceColor: source.color,
    title: display.title,
    detail,
    time: formatTime(event.ts),
    icon: visual.icon,
    color: visual.color,
  };
}

function toCaptureRows(events: FlowSyncEvent[]): CaptureRow[] {
  const deduped = dedupeEvents(events).sort((a, b) => b.ts - a.ts);
  const counts = countVisitsByUrl(deduped);
  return deduped.map((event) => toCaptureRow(event, counts));
}

function startOfLocalDay(ts: number): number {
  const date = new Date(ts);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function addLocalDays(day: number, delta: number): number {
  const date = new Date(day);
  date.setDate(date.getDate() + delta);
  return startOfLocalDay(date.getTime());
}

function localDayKey(ts: number): string {
  const date = new Date(ts);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function dayRange(day: number): { from: number; to: number } {
  return { from: startOfLocalDay(day), to: addLocalDays(day, 1) - 1 };
}

function isSameLocalDay(ts: number, day: number): boolean {
  return localDayKey(ts) === localDayKey(day);
}

function dayLabel(ts: number): string {
  const key = localDayKey(ts);
  const today = Date.now();
  if (key === localDayKey(today)) return "Today";
  if (key === localDayKey(addLocalDays(startOfLocalDay(today), -1))) return "Yesterday";
  return new Date(ts).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Label for the date-picker button only. The feed header keeps the shorter
// weekday label above so its look does not change.
function dateButtonLabel(ts: number): string {
  const key = localDayKey(ts);
  const today = Date.now();
  if (key === localDayKey(today)) return "Today";
  if (key === localDayKey(addLocalDays(startOfLocalDay(today), -1))) return "Yesterday";
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CaptureScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [isPaused, setIsPaused] = useState(false);
  const [settings, setSettings] = useState<FlowSyncSettings | null>(null);
  const [pauseError, setPauseError] = useState(false);
  const [rawEvents, setRawEvents] = useState<FlowSyncEvent[]>([]);
  const [status, setStatus] = useState<LiveConnectionStatus>("connecting");
  const [loadError, setLoadError] = useState(false);
  const [selectedDay, setSelectedDay] = useState(() => startOfLocalDay(Date.now()));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(startOfLocalDay(Date.now())));
  const [reloadToken, setReloadToken] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const pausedRef = useRef(isPaused);
  const dayRef = useRef(selectedDay);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  // Pause is stored on the backend so both extensions stop capturing too.
  // Without a backend this stays local and the button reports the failure.
  useEffect(() => {
    let disposed = false;
    void fetchSettings()
      .then((next) => {
        if (disposed) return;
        setSettings(next);
        setIsPaused(next.capture.paused);
      })
      .catch(() => {
        // Keep the local default. The banner near the Pause button explains
        // that the backend settings could not be loaded.
      });
    return () => {
      disposed = true;
    };
  }, []);

  const togglePause = () => {
    const next = !isPaused;
    setIsPaused(next);
    setPauseError(false);
    setSettings((prev) =>
      prev ? { ...prev, capture: { ...prev.capture, paused: next } } : prev,
    );
    void updateSettings({ capture: { paused: next } })
      .then((saved) => setSettings(saved))
      .catch(() => setPauseError(true));
  };

  useEffect(() => {
    dayRef.current = selectedDay;
  }, [selectedDay]);

  useEffect(() => {
    setCalendarMonth(new Date(selectedDay));
  }, [selectedDay]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load the selected local day from the backend. The WebSocket supplies live
  // additions; both paths go through the same id-dedupe/merge helper.
  useEffect(() => {
    let disposed = false;
    setLoadError(false);
    setRawEvents((prev) => prev.filter((event) => isSameLocalDay(event.ts, selectedDay)));
    void fetchEvents(500, dayRange(selectedDay))
      .then((list) => {
        if (disposed) return;
        setRawEvents((prev) =>
          mergeEvents(
            prev.filter((event) => isSameLocalDay(event.ts, selectedDay)),
            list,
          ),
        );
      })
      .catch(() => {
        if (!disposed) setLoadError(true);
      });
    return () => {
      disposed = true;
    };
  }, [selectedDay, reloadToken]);

  useEffect(() => {
    let disposed = false;
    const handle = connectEvents(
      (list) => {
        if (disposed) return;
        const day = dayRef.current;
        setRawEvents((prev) =>
          mergeEvents(
            prev.filter((event) => isSameLocalDay(event.ts, day)),
            list.filter((event) => isSameLocalDay(event.ts, day)),
          ),
        );
      },
      (event) => {
        if (disposed || pausedRef.current) return;
        const day = dayRef.current;
        if (!isSameLocalDay(event.ts, day)) return;
        setRawEvents((prev) => mergeEvents(prev, [event]));
      },
      (nextStatus) => {
        if (!disposed) setStatus(nextStatus);
      },
    );

    return () => {
      disposed = true;
      handle.close();
    };
  }, []);

  const rows = useMemo(() => toCaptureRows(rawEvents), [rawEvents]);
  const idleGapMs = (settings?.capture.idleGapMinutes ?? 15) * 60 * 1000;

  const isLive = status === "live";
  const isNoKey = status === "no-key";
  const isReconnecting = status === "reconnecting" || status === "connecting";
  const isToday = localDayKey(selectedDay) === localDayKey(Date.now());
  const project = rows[0]?.project ?? "default";
  const sessionStart = rows.length > 0 ? rows[rows.length - 1].ts : null;
  const sessionEnd = rows.length > 0 ? rows[0].ts : null;

  const flowSteps = [
    { label: "Chrome Tabs", icon: Globe, active: rows.length > 0 },
    { label: "Browsing", icon: Search, active: rows.length > 0 },
    { label: "Pages Visited", icon: GitBranch, active: rows.length > 0 },
    { label: "Documentation", icon: FileText, active: rows.length > 0 },
    { label: "Context Signal", icon: Code, active: rows.length > 0 },
    { label: "Dwell Time", icon: Clock, active: rows.length > 0 },
    { label: "Context Captured", icon: CheckCircle2, active: rows.length > 0, final: true },
  ];

  const durationMs = sessionStart
    ? Math.max(0, (isToday || !sessionEnd ? now : sessionEnd) - sessionStart)
    : 0;
  const sessionInfo = [
    { label: "Project", value: project === "default" ? "Default" : project },
    { label: "Duration", value: formatDuration(durationMs) },
    { label: "Events captured", value: String(rows.length) },
    { label: "Connection", value: isNoKey ? "API key required" : isLive ? "Live" : "Reconnecting" },
    { label: "Status", value: isPaused ? "Paused" : "Session active" },
  ];

  const changeDay = (delta: number) => setSelectedDay((day) => addLocalDays(day, delta));
  const goToToday = () => {
    setSelectedDay(startOfLocalDay(Date.now()));
    setCalendarOpen(false);
  };

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
              <div className={`w-1.5 h-1.5 rounded-full ${!isLive || isPaused || isNoKey ? "bg-gray-400" : "bg-emerald-500 animate-pulse"}`} />
              {isNoKey ? "API key required" : !isLive ? "Reconnecting" : isPaused ? "Paused" : "Capturing"}
            </div>
            <button
              onClick={togglePause}
              aria-pressed={isPaused}
              className="flex items-center gap-2 border border-border bg-white text-sm font-medium text-foreground px-4 py-2 min-h-11 sm:min-h-0 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
              {isPaused ? "Resume" : "Pause"}
            </button>
            {pauseError && (
              <span className="text-xs text-amber-700 w-full sm:w-auto">
                Pause could not be saved — check the backend API key.
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Activity feed */}
          <div className="xl:col-span-2">
            <Card className="overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-foreground">Activity Feed</h2>
                  <Badge color="blue">{rows.length} events</Badge>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => changeDay(-1)}
                    aria-label="Previous day"
                    className="w-8 h-8 flex items-center justify-center border border-border bg-white text-foreground rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight size={14} className="rotate-180" />
                  </button>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <button
                        title="Choose a date"
                        aria-haspopup="dialog"
                        className="px-3 h-8 text-xs font-medium text-foreground border border-border bg-white rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {dateButtonLabel(selectedDay)}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto max-w-[calc(100vw-1rem)] p-0"
                      align="center"
                      collisionPadding={8}
                    >
                      <Calendar
                        mode="single"
                        selected={new Date(selectedDay)}
                        month={calendarMonth}
                        onMonthChange={setCalendarMonth}
                        onSelect={(date) => {
                          if (!date) return;
                          setSelectedDay(startOfLocalDay(date.getTime()));
                          setCalendarOpen(false);
                        }}
                        fromDate={new Date(2020, 0, 1)}
                        toDate={new Date()}
                        disabled={{ after: new Date() }}
                        initialFocus
                      />
                      <div className="border-t border-border p-2">
                        <button
                          onClick={goToToday}
                          className="w-full text-xs font-medium text-foreground rounded-md px-2 py-1.5 hover:bg-gray-50 transition-colors"
                        >
                          Jump to today
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <button
                    onClick={() => changeDay(1)}
                    disabled={isToday}
                    aria-label="Next day"
                    className="w-8 h-8 flex items-center justify-center border border-border bg-white text-foreground rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
              <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
                <div className="px-4 sm:px-6 py-2 bg-gray-50 border-b border-border">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {dayLabel(selectedDay)}
                  </span>
                </div>
                {isNoKey && (
                  <div className="px-4 sm:px-6 py-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-800">
                    Live updates are off — no API key set. Add it and refresh:{" "}
                    <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">
                      localStorage.setItem("flowsync:api-key", "&lt;your key&gt;")
                    </code>
                  </div>
                )}
                {loadError ? (
                  <div className="px-4 sm:px-6 py-12 text-center">
                    <div className="text-sm text-muted-foreground mb-4">
                      Could not reach the FlowSync backend at /api/v1/events.
                    </div>
                    <button
                      onClick={() => setReloadToken((token) => token + 1)}
                      className="inline-flex items-center gap-2 border border-border bg-white text-sm font-medium text-foreground px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <RefreshCw size={14} /> Retry
                    </button>
                  </div>
                ) : rows.length === 0 ? (
                  <div className="px-4 sm:px-6 py-12 text-center text-sm text-muted-foreground">
                    No events for {dayLabel(selectedDay).toLowerCase()}. Browse, code, or switch to another day.
                  </div>
                ) : (
                  (() => {
                    const items: React.ReactNode[] = [];
                    for (let i = 0; i < rows.length; i += 1) {
                      const row = rows[i];
                      const RowIcon = row.icon;
                      const prev = rows[i - 1];
                      if (prev) {
                        const gap = prev.ts - row.ts;
                        if (gap >= idleGapMs) {
                          items.push(
                            <div key={`idle-${row.id}`} className="px-4 sm:px-6 py-2 flex items-center gap-3 bg-gray-50/70">
                              <div className="flex-1 h-px bg-border" />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                Idle · {formatIdle(gap)}
                              </span>
                              <div className="flex-1 h-px bg-border" />
                            </div>,
                          );
                        }
                      }
                      items.push(
                        <div key={row.id} className="px-4 sm:px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col items-center gap-1 flex-shrink-0 w-14 sm:w-16 text-right">
                            <div className="text-xs font-mono text-muted-foreground">{row.time}</div>
                          </div>
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${row.color}`}>
                              <RowIcon size={14} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="text-sm font-semibold text-foreground">{row.title}</div>
                                <span className={`inline-flex items-center px-1.5 py-0.5 text-[0.6875rem] font-medium rounded-full border ${row.sourceColor}`}>
                                  {row.sourceName}
                                </span>
                              </div>
                              {row.detail ? (
                                <div className="text-sm text-muted-foreground mt-0.5 break-words">{row.detail}</div>
                              ) : null}
                            </div>
                          </div>
                          {i === 0 && isLive && !isPaused && isToday && (
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0 mt-2" />
                          )}
                        </div>,
                      );
                    }
                    return items;
                  })()
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
              <div className="text-[0.625rem] text-gray-500 uppercase tracking-widest px-2 mb-2">Explorer</div>
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
                        <div className="text-[0.6875rem] uppercase tracking-widest text-gray-500">Matched Project</div>
                        <div className="text-sm font-medium text-gray-200">AI Document Summarizer</div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[0.6875rem] uppercase tracking-widest text-gray-500">Recovered Session</div>
                        <div className="text-sm font-medium text-gray-200">14 March 2026</div>
                      </div>

                      {/* Recovered knowledge */}
                      <div className="space-y-2">
                        <div className="text-[0.6875rem] uppercase tracking-widest text-gray-500">Recovered Knowledge</div>
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
                        <div className="text-[0.6875rem] uppercase tracking-widest text-gray-500">Estimated Recovery</div>
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

const SESSION_GAP_MS = 30 * 60 * 1000;
const TIMELINE_EVENT_TYPES = new Set([
  "tab.visit",
  "file.opened",
  "terminal.error",
  "diagnostic.error",
  "developer.stuck",
  "context.switching",
]);

interface RecoveredSession {
  id: string;
  project: string;
  projectLabel: string;
  startTs: number;
  endTs: number;
  events: FlowSyncEvent[];
  title: string;
  topError?: string;
  counts: { pages: number; files: number; errors: number };
}

function buildRecoveredSessions(events: FlowSyncEvent[]): RecoveredSession[] {
  const sorted = dedupeEvents(events).sort((a, b) => a.ts - b.ts);
  const groups = new Map<string, FlowSyncEvent[]>();

  for (const event of sorted) {
    const key = `${event.project || "default"}|${localDayKey(event.ts)}`;
    const group = groups.get(key);
    if (group) group.push(event);
    else groups.set(key, [event]);
  }

  const sessions: RecoveredSession[] = [];

  const createSession = (groupEvents: FlowSyncEvent[]): void => {
    if (groupEvents.length === 0) return;
    const project = groupEvents[0].project || "default";
    const projectLabel = project === "default" ? "Browsing" : project;
    const startTs = groupEvents[0].ts;
    const endTs = groupEvents[groupEvents.length - 1].ts;

    const errorEvent = [...groupEvents]
      .reverse()
      .find((event) => event.type === "terminal.error" || event.type === "diagnostic.error");
    const topErrorRaw = errorEvent
      ? errorEvent.payload.errorMessage ||
        errorEvent.payload.terminalOutput ||
        (errorEvent.payload.command ? `Command failed: ${errorEvent.payload.command}` : "")
      : "";
    const topError = topErrorRaw ? shortenText(topErrorRaw, 72) : undefined;

    const pageUrls = new Set<string>();
    const files = new Set<string>();
    let errors = 0;
    for (const event of groupEvents) {
      if (event.type === "tab.visit" && event.payload.url) {
        pageUrls.add(sanitizeVisitUrl(event.payload.url));
      }
      if (event.type === "file.opened" && event.payload.fileName) {
        files.add(event.payload.fileName);
      }
      if (event.type === "terminal.error" || event.type === "diagnostic.error") errors += 1;
    }

    sessions.push({
      id: `${project}|${localDayKey(startTs)}|${startTs}`,
      project,
      projectLabel,
      startTs,
      endTs,
      events: groupEvents,
      title: topError ? `${projectLabel} — ${topError}` : `${projectLabel} — ${dayLabel(startTs)}`,
      topError,
      counts: { pages: pageUrls.size, files: files.size, errors },
    });
  };

  for (const groupEvents of groups.values()) {
    let current: FlowSyncEvent[] = [];
    for (const event of groupEvents) {
      if (current.length > 0 && event.ts - current[current.length - 1].ts > SESSION_GAP_MS) {
        createSession(current);
        current = [];
      }
      current.push(event);
    }
    createSession(current);
  }

  return sessions.sort((a, b) => b.endTs - a.endTs);
}

function sessionTimelineEvents(session: RecoveredSession): FlowSyncEvent[] {
  const filtered = session.events.filter((event) => TIMELINE_EVENT_TYPES.has(event.type));
  return filtered.length > 0 ? filtered : session.events;
}

function TimelineScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [events, setEvents] = useState<FlowSyncEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setLoadError(false);
    void fetchEvents(500)
      .then((list) => {
        if (disposed) return;
        setEvents(list);
        setLoading(false);
      })
      .catch(() => {
        if (disposed) return;
        setLoadError(true);
        setLoading(false);
      });
    return () => {
      disposed = true;
    };
  }, []);

  const sessions = useMemo(() => buildRecoveredSessions(events), [events]);
  const selected = sessions.find((session) => session.id === selectedId) ?? sessions[0] ?? null;
  const timeline = selected ? sessionTimelineEvents(selected) : [];

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
              <span className="text-sm text-foreground">Recovered Sessions</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Recovered Sessions</h1>
            <p className="text-muted-foreground mt-1">
              {selected
                ? `${selected.projectLabel} — ${dayLabel(selected.startTs)} — ${formatTime(selected.startTs)} to ${formatTime(selected.endTs)}`
                : "Real sessions reconstructed from your captured events."}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {sessions.length > 0 && (
              <Badge color="green">
                {sessions.length} session{sessions.length === 1 ? "" : "s"}
              </Badge>
            )}
            <button className="flex items-center gap-2 border border-border bg-white text-sm font-medium text-foreground px-4 py-2 min-h-11 sm:min-h-0 rounded-xl hover:bg-gray-50 transition-colors">
              <Copy size={14} /> Export session
            </button>
          </div>
        </div>

        {loading ? (
          <Card className="max-w-2xl mx-auto p-8 text-center text-sm text-muted-foreground">
            Loading recovered sessions…
          </Card>
        ) : loadError ? (
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <div className="text-sm text-muted-foreground mb-4">
              Could not reach the FlowSync backend at /api/v1/events.
            </div>
            <button
              onClick={() => {
                setLoadError(false);
                setLoading(true);
                void fetchEvents(500)
                  .then((list) => {
                    setEvents(list);
                    setLoading(false);
                  })
                  .catch(() => {
                    setLoadError(true);
                    setLoading(false);
                  });
              }}
              className="inline-flex items-center gap-2 border border-border bg-white text-sm font-medium text-foreground px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </Card>
        ) : sessions.length === 0 ? (
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <div className="text-sm font-medium text-foreground mb-1">No recovered sessions yet</div>
            <div className="text-sm text-muted-foreground">
              Sessions appear once Chrome and VS Code have captured real events.
            </div>
          </Card>
        ) : (
          <>
            <Card className="max-w-2xl mx-auto mb-6 overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
                <h2 className="font-semibold text-foreground">Sessions</h2>
                <span className="text-xs text-muted-foreground">Grouped by project and day · 30 min gap</span>
              </div>
              <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedId(session.id)}
                    className={`w-full text-left px-5 py-3 transition-colors hover:bg-gray-50 ${selected?.id === session.id ? "bg-blue-50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground break-words">{session.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {dayLabel(session.startTs)} · {formatTime(session.startTs)}–{formatTime(session.endTs)}
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                        <div>{session.counts.pages} pages · {session.counts.files} files</div>
                        <div className={session.counts.errors > 0 ? "text-red-600 font-medium" : ""}>
                          {session.counts.errors} error{session.counts.errors === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {selected && (
              <div className="max-w-2xl mx-auto">
                <Card className="mb-6 p-5">
                  <div className="text-sm font-semibold text-foreground break-words">{selected.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {selected.counts.pages} pages visited · {selected.counts.files} files opened ·{" "}
                    {selected.counts.errors} terminal/diagnostic error{selected.counts.errors === 1 ? "" : "s"}
                  </div>
                </Card>

                <div className="space-y-0">
                  {timeline.map((event, i) => {
                    const visual = timelineVisual(event);
                    const Icon = visual.icon;
                    const display = eventDisplay(event);
                    const isLast = i === timeline.length - 1;
                    const isError = event.type === "terminal.error" || event.type === "diagnostic.error";
                    const url = event.type === "tab.visit" ? event.payload.url : undefined;
                    return (
                      <div key={eventKey(event)} className="flex gap-4 sm:gap-6">
                        {/* Timeline spine */}
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center flex-shrink-0 ${visual.color}`}>
                            <Icon size={15} />
                          </div>
                          {!isLast && <div className="w-px flex-1 bg-border mt-1 mb-1 min-h-[2rem]" />}
                        </div>

                        {/* Content */}
                        <div className={`flex-1 pb-8 ${isLast ? "pb-0" : ""}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <span className="text-xs font-mono text-muted-foreground">{formatTime(event.ts)}</span>
                                <span className={`text-sm font-semibold ${isError ? "text-red-600" : "text-foreground"} break-words`}>
                                  {display.title}
                                </span>
                              </div>
                              {display.detail && (
                                <div className={`text-sm mt-0.5 break-words ${isError ? "text-red-600" : "text-muted-foreground"}`}>
                                  {display.detail}
                                </div>
                              )}
                            </div>
                            {url && (
                              <button
                                onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                                className="flex items-center gap-1.5 text-xs font-medium text-primary bg-blue-50 border border-blue-200 px-3 py-3 sm:py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex-shrink-0 mt-1"
                              >
                                <ExternalLink size={12} /> Open link
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
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

const THEME_STORAGE_KEY = "flowsync:theme";
const FONT_STORAGE_KEY = "flowsync:font-size";

type FontSize = "small" | "medium" | "large";

const FONT_SIZE_PX: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

function readStoredTheme(): boolean {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark";
  } catch {
    return false;
  }
}

function readStoredFontSize(): FontSize {
  try {
    const stored = window.localStorage.getItem(FONT_STORAGE_KEY);
    return stored === "small" || stored === "large" ? stored : "medium";
  } catch {
    return "medium";
  }
}

const DEFAULT_ALLOWED_DOMAINS = [
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "stackoverflow.com",
  "npmjs.com",
  "pypi.org",
  "docs.python.org",
  "developer.mozilla.org",
  "localhost",
  "127.0.0.1",
  "vercel.app",
  "railway.app",
  "supabase.com",
  "tailwindcss.com",
  "reactjs.org",
  "react.dev",
  "nextjs.org",
  "vitejs.dev",
  "fastapi.tiangolo.com",
  "devdocs.io",
  "caniuse.com",
  "regex101.com",
  "codepen.io",
  "codesandbox.io",
  "replit.com",
  "render.com",
  "heroku.com",
  "digitalocean.com",
  "aws.amazon.com",
  "console.cloud.google.com",
  "portal.azure.com",
  "leetcode.com",
  "codeforces.com",
  "codechef.com",
  "hackerrank.com",
  "geeksforgeeks.org",
  "kaggle.com",
  "huggingface.co",
  "colab.research.google.com",
];

function mergeSettings(base: FlowSyncSettings, patch: SettingsPatch): FlowSyncSettings {
  const next = { ...base };
  for (const key of Object.keys(patch) as (keyof FlowSyncSettings)[]) {
    const value = patch[key];
    if (value === undefined) continue;
    (next as unknown as Record<string, object>)[key] = {
      ...(base as unknown as Record<string, object>)[key],
      ...(value as object),
    };
  }
  return next;
}

function SettingSwitch({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full flex items-center transition-colors flex-shrink-0 mt-0.5 before:absolute before:-inset-2.5 before:content-[''] ${checked ? "bg-primary justify-end" : "bg-gray-200 justify-start"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <div className="w-5 h-5 rounded-full bg-white shadow mx-0.5" />
    </button>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

function SettingsScreen({ navigate }: { navigate: (s: Screen) => void }) {
  const [activeSection, setActiveSection] = useState("capture");
  const [darkMode, setDarkMode] = useState(readStoredTheme);
  const [fontSize, setFontSize] = useState<FontSize>(readStoredFontSize);
  const [settings, setSettings] = useState<FlowSyncSettings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [stats, setStats] = useState<FlowSyncStats | null>(null);
  const [meta, setMeta] = useState<FlowSyncMeta | null>(null);
  const [newDomain, setNewDomain] = useState("");
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm">("idle");
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const saveSeq = useRef(0);

  const loadSettings = () => {
    setSettingsError(null);
    void Promise.allSettled([fetchSettings(), fetchStats(), fetchMeta()]).then((results) => {
      const [settingsResult, statsResult, metaResult] = results;
      if (settingsResult.status === "fulfilled") {
        setSettings(settingsResult.value);
      } else {
        setSettingsError(
          'Could not load settings. Start the backend and set localStorage "flowsync:api-key" to your FLOWSYNC_API_KEY, then reload.',
        );
      }
      if (statsResult.status === "fulfilled") setStats(statsResult.value);
      if (metaResult.status === "fulfilled") setMeta(metaResult.value);
    });
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, darkMode ? "dark" : "light");
    } catch {
      // Storage can be unavailable; the class still applies for this visit.
    }
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-size", FONT_SIZE_PX[fontSize]);
    try {
      window.localStorage.setItem(FONT_STORAGE_KEY, fontSize);
    } catch {
      // Storage can be unavailable; the size still applies for this visit.
    }
  }, [fontSize]);

  const save = async (patch: SettingsPatch) => {
    if (!settings) return;
    const seq = ++saveSeq.current;
    setSettings(mergeSettings(settings, patch));
    setSettingsError(null);
    try {
      const saved = await updateSettings(patch);
      if (seq === saveSeq.current) {
        setSettings(saved);
        window.dispatchEvent(new CustomEvent("flowsync:settings-updated", { detail: saved }));
      }
    } catch {
      if (seq === saveSeq.current) {
        setSettingsError("Could not save settings. Check that the backend is running and the API key is set.");
        void fetchSettings().then(setSettings).catch(() => {});
      }
    }
  };

  const capture = settings?.capture;
  const allowedDomains = settings?.chrome.allowedDomains ?? [];
  const settingsReady = settings !== null;

  const saveDomains = (domains: string[]) => {
    void save({ chrome: { allowedDomains: domains } });
  };

  const addDomain = () => {
    const normalized = newDomain.trim().toLowerCase().replace(/^\.+/, "").replace(/\/+$/, "");
    setNewDomain("");
    if (!normalized || allowedDomains.includes(normalized)) return;
    saveDomains([...allowedDomains, normalized]);
  };

  const removeDomain = (domain: string) => {
    saveDomains(allowedDomains.filter((entry) => entry !== domain));
  };

  const handleExport = async () => {
    setExportMessage(null);
    try {
      const data = await exportData();
      const day = new Date().toISOString().slice(0, 10);
      downloadJson(data, `flowsync-export-${day}.json`);
      setExportMessage(`Exported ${data.events.length} event(s).`);
    } catch {
      setExportMessage("Export failed. Check the backend and API key.");
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteMessage(null);
    try {
      const deleted = await deleteAllData();
      setDeleteStep("idle");
      setDeleteMessage(`Deleted ${deleted} event(s).`);
      void fetchStats().then(setStats).catch(() => {});
    } catch {
      setDeleteMessage("Delete failed. Check the backend and API key.");
    } finally {
      setDeleting(false);
    }
  };

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
          {settingsError && (
            <div className="max-w-xl mb-4 p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800">
              {settingsError}
            </div>
          )}
          {!settingsReady && !settingsError && (
            <div className="max-w-xl mb-4 text-xs text-muted-foreground">Loading settings…</div>
          )}

          {activeSection === "capture" && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Capture Preferences</h2>
                <p className="text-sm text-muted-foreground">Control how FlowSync records your debugging activity.</p>
              </div>

              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-sm font-medium text-foreground">Pause all capture</div>
                      {capture?.paused && <Badge color="yellow">Paused</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Takes priority over every toggle below. Existing history is kept; new activity is not recorded.
                    </div>
                  </div>
                  <SettingSwitch
                    label="Pause all capture"
                    checked={capture?.paused ?? false}
                    disabled={!settingsReady}
                    onChange={(next) => void save({ capture: { paused: next } })}
                  />
                </div>
              </Card>

              {[
                {
                  label: "Auto-capture on error detection",
                  desc: "Record VS Code diagnostics, failed commands, and stuck sessions.",
                  checked: capture?.autoCaptureErrors ?? true,
                  onChange: (next: boolean) => void save({ capture: { autoCaptureErrors: next } }),
                  disabled: !settingsReady,
                  comingSoon: false,
                },
                {
                  label: "Capture terminal commands",
                  desc: "Record failed terminal commands during active debug sessions.",
                  checked: capture?.terminalCommands ?? true,
                  onChange: (next: boolean) => void save({ capture: { terminalCommands: next } }),
                  disabled: !settingsReady,
                  comingSoon: false,
                },
                {
                  label: "Capture browser tabs",
                  desc: "Log URLs visited on the Chrome extension's allowed domains.",
                  checked: capture?.browserTabs ?? true,
                  onChange: (next: boolean) => void save({ capture: { browserTabs: next } }),
                  disabled: !settingsReady,
                  comingSoon: false,
                },
                {
                  label: "Capture personal notes",
                  desc: "Personal notes are not a FlowSync feature yet.",
                  checked: false,
                  onChange: () => {},
                  disabled: true,
                  comingSoon: true,
                },
              ].map((item) => (
                <Card key={item.label} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-sm font-medium text-foreground">{item.label}</div>
                        {item.comingSoon && <Badge color="gray">Coming soon</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
                    </div>
                    <SettingSwitch
                      label={item.label}
                      checked={item.checked}
                      disabled={item.disabled}
                      onChange={item.onChange}
                    />
                  </div>
                </Card>
              ))}

              <Card className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Idle gap divider</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Show an idle marker in Live Capture when events are this far apart.
                    </div>
                  </div>
                  <select
                    aria-label="Idle gap minutes"
                    value={capture?.idleGapMinutes ?? 15}
                    disabled={!settingsReady}
                    onChange={(event) => void save({ capture: { idleGapMinutes: Number(event.target.value) } })}
                    className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground disabled:opacity-50"
                  >
                    {[5, 10, 15, 30, 60].map((minutes) => (
                      <option key={minutes} value={minutes}>{minutes} min</option>
                    ))}
                  </select>
                </div>
              </Card>
            </div>
          )}

          {activeSection === "chrome" && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Chrome Extension</h2>
                <p className="text-sm text-muted-foreground">Domains the extension is allowed to capture. Changes sync within 60 seconds.</p>
              </div>
              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">Allowed domains</div>
                    <div className="text-xs text-muted-foreground mt-1">Tabs outside this list are ignored and never stored.</div>
                  </div>
                  <Badge color="gray">{allowedDomains.length} domains</Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  <input
                    value={newDomain}
                    onChange={(event) => setNewDomain(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") addDomain();
                    }}
                    placeholder="example.com"
                    aria-label="Add allowed domain"
                    disabled={!settingsReady}
                    className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={addDomain}
                    disabled={!settingsReady || newDomain.trim().length === 0}
                    className="h-9 px-3 rounded-lg border border-border bg-white text-sm font-medium text-foreground hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-3 max-h-64 overflow-y-auto border border-border rounded-xl divide-y divide-border">
                  {allowedDomains.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-muted-foreground">No domains configured. The extension keeps its last cached list.</div>
                  ) : (
                    allowedDomains.map((domain) => (
                      <div key={domain} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="text-sm font-mono text-foreground break-all">{domain}</span>
                        <button
                          type="button"
                          onClick={() => removeDomain(domain)}
                          disabled={!settingsReady}
                          className="text-xs text-muted-foreground hover:text-red-600 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => saveDomains([...DEFAULT_ALLOWED_DOMAINS])}
                  disabled={!settingsReady}
                  className="mt-3 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                >
                  Reset to defaults
                </button>
              </Card>
              <Card className="p-5">
                <div className="text-sm font-medium text-foreground mb-1">Offline behaviour</div>
                <div className="text-xs text-muted-foreground">
                  The extension caches these settings and keeps using the cached copy when the backend is unreachable. Defaults are used only when no cache exists.
                </div>
              </Card>
            </div>
          )}

          {activeSection === "vscode" && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">VS Code Extension</h2>
                <p className="text-sm text-muted-foreground">Capture behaviour for the VS Code extension. Changes sync within 60 seconds.</p>
              </div>
              <Card className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Stuck detection threshold</div>
                    <div className="text-xs text-muted-foreground mt-1">Idle time before a stuck session can be reported.</div>
                  </div>
                  <select
                    aria-label="Stuck detection threshold"
                    value={settings?.vscode.stuckThresholdMinutes ?? 4}
                    disabled={!settingsReady}
                    onChange={(event) => void save({ vscode: { stuckThresholdMinutes: Number(event.target.value) } })}
                    className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground disabled:opacity-50"
                  >
                    {[2, 4, 5, 10, 15].map((minutes) => (
                      <option key={minutes} value={minutes}>{minutes} min</option>
                    ))}
                  </select>
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Redact secrets</div>
                    <div className="text-xs text-muted-foreground mt-1">Remove tokens, keys, and passwords from captured error and command text.</div>
                  </div>
                  <SettingSwitch
                    label="Redact secrets"
                    checked={settings?.vscode.redactSecrets ?? true}
                    disabled={!settingsReady}
                    onChange={(next) => void save({ vscode: { redactSecrets: next } })}
                  />
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Sync interval</div>
                    <div className="text-xs text-muted-foreground mt-1">How often buffered events are sent to the backend.</div>
                  </div>
                  <select
                    aria-label="Sync interval"
                    value={settings?.vscode.syncIntervalSec ?? 10}
                    disabled={!settingsReady}
                    onChange={(event) => void save({ vscode: { syncIntervalSec: Number(event.target.value) } })}
                    className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground disabled:opacity-50"
                  >
                    {[5, 10, 30, 60].map((seconds) => (
                      <option key={seconds} value={seconds}>{seconds} sec</option>
                    ))}
                  </select>
                </div>
              </Card>
              <Card className="p-5">
                <div className="text-sm font-medium text-foreground mb-1">Offline behaviour</div>
                <div className="text-xs text-muted-foreground">
                  The extension caches these settings and keeps using the cached copy when the backend is unreachable. Defaults are used only when no cache exists.
                </div>
              </Card>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Notifications</h2>
                <p className="text-sm text-muted-foreground">Choose what FlowSync tells you while it is running.</p>
              </div>
              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">Error toasts</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Show an in-app toast when a new diagnostic, terminal, or stuck error event arrives.
                    </div>
                  </div>
                  <SettingSwitch
                    label="Error toasts"
                    checked={settings?.notifications.errorToasts ?? true}
                    disabled={!settingsReady}
                    onChange={(next) => void save({ notifications: { errorToasts: next } })}
                  />
                </div>
              </Card>
              <Card className="p-5">
                <div className="text-sm font-medium text-foreground mb-1">How this works</div>
                <div className="text-xs text-muted-foreground">
                  Toasts use the live event stream and only fire for real error events. They do not fire for replayed history. If the API key is missing, the live stream is unavailable and no toasts appear.
                </div>
              </Card>
            </div>
          )}

          {activeSection === "embedding" && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Embedding Settings</h2>
                <p className="text-sm text-muted-foreground">Status of the semantic index used for context retrieval.</p>
              </div>
              <Card className="p-5">
                <SettingsRow label="Embedding engine" value="Not configured" />
                <SettingsRow label="Semantic index" value="Not generated" />
                <SettingsRow label="Provider" value="None" />
                <SettingsRow label="Events stored" value={stats ? String(stats.totalEvents) : "—"} />
              </Card>
              <Card className="p-5">
                <div className="text-sm font-medium text-foreground mb-1">No embeddings are generated yet</div>
                <div className="text-xs text-muted-foreground">
                  FlowSync currently stores raw events and reconstructs sessions from them. An embedding provider is not required for capture, the timeline, or recovered sessions.
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">Add an embedding provider</div>
                  <div className="flex items-center gap-2">
                    <Badge color="gray">Coming soon</Badge>
                    <button type="button" disabled className="h-9 px-3 rounded-lg border border-border bg-white text-sm font-medium text-foreground opacity-50 cursor-not-allowed">
                      Configure
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeSection === "models" && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">AI Models</h2>
                <p className="text-sm text-muted-foreground">Model providers used for retrieval or generation.</p>
              </div>
              <Card className="p-5">
                <SettingsRow label="Model provider" value="None configured" />
                <SettingsRow label="Generation" value="Off" />
                <SettingsRow label="Retrieval" value="Local event history" />
              </Card>
              <Card className="p-5">
                <div className="text-sm font-medium text-foreground mb-1">No AI model is called</div>
                <div className="text-xs text-muted-foreground">
                  Recovered sessions are reconstructed from your own stored events. FlowSync does not send activity to a model provider.
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">Add a model provider</div>
                  <div className="flex items-center gap-2">
                    <Badge color="gray">Coming soon</Badge>
                    <button type="button" disabled className="h-9 px-3 rounded-lg border border-border bg-white text-sm font-medium text-foreground opacity-50 cursor-not-allowed">
                      Add provider
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeSection === "sync" && (
            <div className="max-w-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Cloud Sync</h2>
                <p className="text-sm text-muted-foreground">Storage location and data controls.</p>
              </div>
              <Card className="p-5">
                <SettingsRow label="Cloud sync" value="Off" />
                <SettingsRow label="Storage" value="Local SQLite" />
                <SettingsRow label="Data leaves this device" value="No" />
                <SettingsRow label="Retention" value={meta ? `${meta.retentionDays} days` : "—"} />
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">Enable cloud sync</div>
                  <div className="flex items-center gap-2">
                    <Badge color="gray">Coming soon</Badge>
                    <button type="button" disabled className="h-9 px-3 rounded-lg border border-border bg-white text-sm font-medium text-foreground opacity-50 cursor-not-allowed">
                      Enable
                    </button>
                  </div>
                </div>
              </Card>
              <Card className="p-5">
                <div className="text-sm font-medium text-foreground mb-1">Data controls</div>
                <div className="text-xs text-muted-foreground mb-4">
                  Retention is set by the backend's RETENTION_DAYS environment variable and cannot be edited here.
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleExport()}
                    className="h-9 px-3 rounded-lg border border-border bg-white text-sm font-medium text-foreground hover:bg-gray-50"
                  >
                    Export JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDeleteStep("confirm"); setDeleteMessage(null); }}
                    className="h-9 px-3 rounded-lg border border-red-200 bg-red-50 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    Delete all events
                  </button>
                </div>
                {exportMessage && <div className="mt-3 text-xs text-muted-foreground">{exportMessage}</div>}
                {deleteStep === "confirm" && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                    <div className="text-xs text-red-800">
                      This permanently deletes every stored event. Extensions keep capturing afterwards unless capture is paused.
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setDeleteStep("idle")}
                        className="h-8 px-3 rounded-lg border border-border bg-white text-xs font-medium text-foreground hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete()}
                        disabled={deleting}
                        className="h-8 px-3 rounded-lg border border-red-300 bg-red-600 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleting ? "Deleting…" : "Delete permanently"}
                      </button>
                    </div>
                  </div>
                )}
                {deleteMessage && <div className="mt-3 text-xs text-muted-foreground">{deleteMessage}</div>}
              </Card>
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
                  <SettingSwitch
                    label="Dark mode"
                    checked={darkMode}
                    onChange={setDarkMode}
                  />
                </div>
              </Card>
              <Card className="p-5">
                <div className="text-sm font-medium text-foreground mb-3">Font size</div>
                <div className="flex gap-2">
                  {(["small", "medium", "large"] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setFontSize(size)}
                      aria-pressed={fontSize === size}
                      className={`flex-1 py-2 min-h-11 sm:min-h-0 rounded-xl text-sm border transition-colors ${fontSize === size ? "border-primary bg-blue-50 text-primary font-medium" : "border-border text-muted-foreground hover:border-gray-300"}`}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
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
                <p className="text-sm text-muted-foreground">Reference only — these shortcuts are not bound in FlowSync yet.</p>
              </div>
              <Card className="overflow-hidden">
                <div className="divide-y divide-border">
                  {shortcuts.map((s) => (
                    <div key={s.action} className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:justify-between">
                      <div className="text-sm text-foreground">{s.action}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Not bound</span>
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

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

function NotificationBridge({ active }: { active: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    let disposed = false;
    const load = () => {
      void fetchSettings()
        .then((next) => {
          if (!disposed) setEnabled(next.notifications.errorToasts);
        })
        .catch(() => {
          // Keep the last known value when the backend is unavailable.
        });
    };
    load();
    const timer = setInterval(load, 60_000);
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<FlowSyncSettings>).detail;
      if (detail?.notifications) setEnabled(detail.notifications.errorToasts);
    };
    window.addEventListener("flowsync:settings-updated", onUpdate);
    return () => {
      disposed = true;
      clearInterval(timer);
      window.removeEventListener("flowsync:settings-updated", onUpdate);
    };
  }, []);

  useEffect(() => {
    if (!active || !enabled) return;
    const handle = connectEvents(
      () => {},
      (event) => {
        if (!enabledRef.current) return;
        if (!["diagnostic.error", "terminal.error", "developer.stuck"].includes(event.type)) return;
        const title =
          event.type === "developer.stuck"
            ? "FlowSync detected a stuck session"
            : "FlowSync captured an error";
        const description =
          event.payload.errorMessage ||
          event.payload.command ||
          event.payload.fileName ||
          "Open Live Capture for details.";
        toast.error(title, { description: description.slice(0, 180) });
      },
      () => {},
    );
    return () => handle.close();
  }, [active, enabled]);

  return null;
}

function ThemedToaster() {
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      theme={dark ? "dark" : "light"}
    />
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");

  const navigate = (s: Screen) => setScreen(s);

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }} className="size-full">
      <NotificationBridge active={screen !== "landing"} />
      <ThemedToaster />
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
