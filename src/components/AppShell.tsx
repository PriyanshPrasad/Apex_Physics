import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import {
  LayoutDashboard, BookOpen, Dumbbell, FlaskConical, Map as MapIcon,
  Sigma, TriangleAlert, TrendingUp, ClipboardList, Search, Sun, Moon,
  Blocks, Scale, LogOut, Atom, Ruler, Stethoscope,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { searchCurriculum, COURSES } from "@/data/curriculum";
import { useProgress } from "@/lib/progress";
import { M } from "@/components/math/Math";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/courses", label: "Courses", icon: Blocks },
  { to: "/practice", label: "Practice", icon: Dumbbell },
  { to: "/labs", label: "Labs", icon: FlaskConical },
  { to: "/sims", label: "Simulations", icon: Atom },
  { to: "/map", label: "Knowledge Map", icon: MapIcon },
  { to: "/equations", label: "Equation Library", icon: Sigma },
  { to: "/units", label: "Units & Dimensions", icon: Ruler },
  { to: "/mistakes", label: "Mistakes", icon: TriangleAlert },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/compare", label: "Compare Courses", icon: Scale },
  { to: "/diagnostic", label: "Diagnostic", icon: ClipboardList },
  { to: "/ap-diagnostic", label: "AP Diagnostic", icon: Stethoscope },
];

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  return (
    <button
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("apm-theme", next ? "dark" : "light");
      }}
      className="clay-sm clay-press flex h-9 w-9 items-center justify-center"
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [q, setQ] = useState("");
  const { concepts, units } = searchCurriculum(q);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="clay max-h-[70vh] overflow-auto border-0 sm:max-w-lg [&>button]:hidden">
        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
          <Search className="size-4 text-[var(--clay-4)]" /> Search physics
        </DialogTitle>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="friction, gauss, why does normal force change…"
          className="clay-inset w-full px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
        />
        {q.trim() && (
          <div className="space-y-1">
            {concepts.length === 0 && units.length === 0 && (
              <p className="px-2 py-4 text-sm text-muted-foreground">No matches. Try “energy”, “circuits”, or “projectile”.</p>
            )}
            {concepts.slice(0, 8).map((c) => (
              <Link
                key={c.id}
                to={`/learn/${c.courseId}/${c.id}`}
                onClick={() => onOpenChange(false)}
                className="clay-sm clay-press flex items-center justify-between px-4 py-2.5"
              >
                <span>
                  <span className="text-sm font-semibold">{c.name}</span>
                  <span className="block text-xs text-muted-foreground">{c.tagline}</span>
                </span>
                <span className="clay-sm px-2 py-0.5 text-[10px] font-bold text-[var(--clay-primary-deep)]">{c.courseId.toUpperCase()}</span>
              </Link>
            ))}
            {units.slice(0, 4).map((u) => (
              <Link
                key={u.id}
                to={`/learn/${u.course}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center justify-between px-4 py-2 text-sm"
              >
                <span>Unit {u.num}: {u.name}</span>
                <span className="text-xs text-muted-foreground">{u.course.toUpperCase()}</span>
              </Link>
            ))}
          </div>
        )}
        {!q.trim() && (
          <p className="px-2 pb-2 text-xs text-muted-foreground">
            Try searching a concept (<M>{"F = \\mu F_N"}</M>), a question (“why does normal force change?”), or a course.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { signOut } = useAuth();
  const p = useProgress();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r border-sidebar-border bg-sidebar p-4 md:flex">
        <Link to="/dashboard" className="mb-4 flex items-center gap-2 px-2 py-1">
          <div className="clay-sm flex h-10 w-10 items-center justify-center bg-[var(--clay-4)] text-lg text-white">⚛</div>
          <div>
            <p className="text-sm font-bold leading-tight">AP Physics</p>
            <p className="text-xs text-muted-foreground">Mastery</p>
          </div>
        </Link>
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `clay-press flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? "clay-tint text-[var(--clay-primary-deep)]" : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </NavLink>
        ))}
        <div className="mt-auto flex items-center gap-2 pt-4">
          <ThemeToggle />
          <button
            onClick={() => void signOut()}
            className="clay-sm clay-press flex h-9 items-center gap-2 px-3 text-xs font-semibold text-muted-foreground"
          >
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center gap-3 bg-background/80 px-4 py-3 backdrop-blur md:px-8">
          <Link to="/dashboard" className="clay-sm flex h-9 w-9 items-center justify-center bg-[var(--clay-4)] text-white md:hidden">⚛</Link>
          <button
            onClick={() => setSearchOpen(true)}
            className="clay-sm clay-press flex flex-1 items-center gap-2 px-4 py-2 text-sm text-muted-foreground"
          >
            <Search className="size-4" />
            Search concepts, units, mistakes…
            <kbd className="ml-auto rounded-md bg-clay-2 px-1.5 py-0.5 text-[10px] font-semibold">⌘K</kbd>
          </button>
          <span className="clay-sm hidden px-3 py-1.5 text-xs font-bold text-[var(--clay-primary-deep)] sm:block">
            🔥 {p.streak} day streak
          </span>
        </header>
        {/* Mobile nav — the sidebar is desktop-only, so phones need their own path in */}
        <nav className="scrollbar-none sticky top-[60px] z-10 flex gap-1.5 overflow-x-auto bg-background/80 px-4 py-2 backdrop-blur md:hidden">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ${
                  isActive ? "bg-[var(--clay-primary-tint)] text-[var(--clay-primary-deep)]" : "bg-clay-2 text-muted-foreground"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="px-4 pb-16 md:px-8">
          <Outlet />
        </main>
        <footer className="px-4 pb-8 text-center text-[11px] text-muted-foreground md:px-8">
          {COURSES.length} courses · curriculum aligned to the current College Board AP Physics frameworks · progress saved on this device
        </footer>
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
