import { useEffect, useState, type MouseEvent } from "react";
import { Menu, X } from "lucide-react";

export const LANDING_NAV_LINKS = [
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How it works" },
  { id: "privacy", label: "Privacy" },
  { id: "pricing", label: "Pricing" },
  { id: "docs", label: "Docs" },
] as const;

function scrollToSection(id: string): void {
  const section = document.getElementById(id);
  if (!section) return;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  section.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
}

function useActiveSection(): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      // Matches the sticky header plus a little breathing room.
      const marker = 96;
      let current: string | null = null;
      for (const link of LANDING_NAV_LINKS) {
        const section = document.getElementById(link.id);
        if (!section) continue;
        const rect = section.getBoundingClientRect();
        if (rect.top <= marker && rect.bottom > marker) {
          current = link.id;
          break;
        }
      }
      setActive(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return active;
}

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const active = useActiveSection();

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const handleClick = (
    event: MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    event.preventDefault();
    scrollToSection(id);
    setMenuOpen(false);
  };

  return (
    <>
      <nav
        aria-label="Landing page sections"
        className="hidden md:flex items-center gap-6"
      >
        {LANDING_NAV_LINKS.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            aria-current={active === link.id ? "true" : undefined}
            onClick={(event) => handleClick(event, link.id)}
            className={`text-sm transition-colors ${
              active === link.id
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {link.label}
          </a>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        aria-controls="landing-mobile-nav"
        className="md:hidden flex size-11 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted"
      >
        {menuOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {menuOpen && (
        <div
          id="landing-mobile-nav"
          className="md:hidden absolute left-0 right-0 top-16 border-b border-border bg-card/95 backdrop-blur-md shadow-lg"
        >
          <nav
            aria-label="Landing page sections"
            className="max-w-7xl mx-auto px-4 py-2"
          >
            {LANDING_NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                aria-current={active === link.id ? "true" : undefined}
                onClick={(event) => handleClick(event, link.id)}
                className={`block rounded-xl px-3 py-3 text-sm transition-colors ${
                  active === link.id
                    ? "bg-blue-50 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
