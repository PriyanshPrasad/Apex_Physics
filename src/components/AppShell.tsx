import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, BookOpen, Dumbbell, FlaskConical, Map as MapIcon,
  Sigma, TriangleAlert, TrendingUp, ClipboardList, Search, Sun, Moon,
  Blocks, Scale, LogOut, Atom, Ruler, Stethoscope, Menu, X,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { searchCurriculum, COURSES } from "@/data/curriculum";
import { useProgress } from "@/lib/progress";
import { M } from "@/components/math/Math";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/logo.svg";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      {/* Desktop sidebar: expands on hover, while preserving every existing route. */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 76 }}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
        className="app-sidebar sticky top-0 hidden h-screen shrink-0 flex-col gap-1 overflow-y-auto border-r border-sidebar-border bg-sidebar p-4 md:flex"
      >
        <Link to="/dashboard" className="mb-4 flex min-h-10 items-center gap-2 px-2 py-1" aria-label="Apex Physics dashboard">
          <div className="clay-sm h-10 w-10 shrink-0 overflow-hidden"><img src={logo} alt="Apex Physics quantum brain logo" className="h-full w-full object-cover" /></div>
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="min-w-0 whitespace-nowrap">
                <p className="text-sm font-bold leading-tight">Apex Physics</p>
                <p className="text-xs text-muted-foreground">Interactive learning</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
        <div className="flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={!sidebarOpen ? label : undefined}
              className={({ isActive }) =>
                `clay-press flex min-h-10 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "clay-tint text-[var(--clay-primary-deep)]" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <Icon className="size-4 shrink-0" />
              <motion.span initial={false} animate={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? "auto" : 0 }} className="overflow-hidden whitespace-nowrap">
                {label}
              </motion.span>
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-2 pt-4">
          <ThemeToggle />
          <motion.button
            initial={false}
            animate={{ opacity: sidebarOpen ? 1 : 0, width: sidebarOpen ? "auto" : 0 }}
            onClick={() => void signOut()}
            className="clay-sm clay-press flex h-9 items-center gap-2 overflow-hidden whitespace-nowrap px-3 text-xs font-semibold text-muted-foreground"
          >
            <LogOut className="size-3.5 shrink-0" /> Sign out
          </motion.button>
        </div>
      </motion.aside>

      {/* Main column */}
      <div className="min-w-0 flex-1">
        <header className="app-topbar sticky top-0 z-20 flex items-center gap-3 bg-background/80 px-4 py-3 backdrop-blur md:px-8">
          <button onClick={() => setSidebarOpen(true)} className="clay-sm flex h-9 w-9 items-center justify-center md:hidden" aria-label="Open navigation"><Menu className="size-4" /></button>
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
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div className="fixed inset-0 z-40 bg-black/30 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)}>
              <motion.nav className="h-full w-[min(86vw,320px)] bg-sidebar p-5" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ duration: 0.2 }} onClick={(e) => e.stopPropagation()} aria-label="Mobile navigation">
                <div className="mb-6 flex items-center justify-between">
                  <Link to="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2">
                    <img src={logo} alt="Apex Physics quantum brain logo" className="h-10 w-10 rounded-xl" />
                    <span className="text-sm font-bold">Apex Physics</span>
                  </Link>
                  <button onClick={() => setSidebarOpen(false)} className="clay-sm flex h-9 w-9 items-center justify-center" aria-label="Close navigation"><X className="size-4" /></button>
                </div>
                <div className="flex flex-col gap-1">
                  {NAV.map(({ to, label, icon: Icon }) => (
                    <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `clay-press flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium ${isActive ? "clay-tint text-[var(--clay-primary-deep)]" : "text-muted-foreground"}`}>
                      <Icon className="size-4" /> {label}
                    </NavLink>
                  ))}
                </div>
                <div className="mt-6 flex items-center gap-2"><ThemeToggle /><button onClick={() => { void signOut(); setSidebarOpen(false); }} className="clay-sm clay-press flex h-9 items-center gap-2 px-3 text-xs font-semibold text-muted-foreground"><LogOut className="size-3.5" /> Sign out</button></div>
              </motion.nav>
            </motion.div>
          )}
        </AnimatePresence>
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
