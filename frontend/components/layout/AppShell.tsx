"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  BookOpenCheck,
  Bot,
  ChevronDown,
  Home,
  Library,
  LogOut,
  Menu,
  Plus,
  Settings,
  Sparkles,
  Users
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/utils/cn";
import { useAssignmentStore } from "@/store/assignmentStore";
import { useAuthStore } from "@/store/authStore";
import { useMounted } from "@/hooks/useMounted";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  hideChrome?: boolean;
}

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "My Groups", href: "/groups", icon: Users },
  { label: "Assignments", href: "/", icon: BookOpenCheck },
  { label: "AI Teacher's Toolkit", href: "/create", icon: Bot },
  { label: "My Library", href: "/library", icon: Library }
];

const mobileItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Assignments", href: "/", icon: BookOpenCheck },
  { label: "Library", href: "/library", icon: Library },
  { label: "AI Toolkit", href: "/create", icon: Sparkles }
];

function topbarLabel(pathname: string) {
  if (pathname.startsWith("/create")) return "Create New";
  if (pathname.includes("/paper")) return "Question Paper";
  if (pathname.startsWith("/generate")) return "Generating";
  return "Assignment";
}

function isActive(pathname: string, href: string, label: string) {
  if (label === "Assignments" && pathname === "/") return true;
  if (href === "/create" && pathname.startsWith("/create")) return true;
  return pathname === href;
}

export function AppShell({ children, title, subtitle, actions, hideChrome = false }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useMounted();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const assignments = useAssignmentStore((state) => state.assignments);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, mounted, router]);

  if (hideChrome) {
    return <main>{children}</main>;
  }

  if (!mounted || !isAuthenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper text-ink dark:bg-[#181818] dark:text-white">
        <div className="text-center">
          <Logo className="justify-center" />
          <p className="mt-4 text-sm font-semibold text-neutral-500 dark:text-neutral-300">Preparing secure workspace</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-[#181818] dark:text-white">
      <aside className="print-hidden fixed left-4 top-4 z-40 hidden h-[calc(100vh-2rem)] w-[238px] rounded-2xl bg-white p-4 shadow-sidebar dark:bg-[#232323] lg:flex lg:flex-col">
        <Logo />
        <Link href="/create" className="mt-10">
          <Button className="w-full" size="sm">
            <Plus className="h-4 w-4" />
            Create Assignment
          </Button>
        </Link>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href, item.label);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-ink dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white",
                  active && "bg-neutral-100 text-ink dark:bg-white/10 dark:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.label === "Assignments" && assignments.length ? (
                  <span className="rounded-full bg-ember px-2 py-0.5 text-[10px] font-bold text-white">
                    {assignments.length}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <Link
            href="/settings"
            className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-ink dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <div className="rounded-xl bg-neutral-100 p-3 dark:bg-white/10">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-emerald-100 to-orange-100 text-lg">
                DP
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{user?.schoolName ?? "Delhi Public School"}</p>
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-300">Bokaro Steel City</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-ink dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[268px]">
        <header className="print-hidden sticky top-0 z-30 border-b border-black/5 bg-paper/85 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#181818]/85 sm:px-6 lg:px-4 lg:py-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm dark:bg-[#232323]">
            <div className="flex items-center gap-2 lg:hidden">
              <Logo compact />
            </div>
            <Button variant="ghost" size="icon" title="Go back" aria-label="Go back" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="hidden h-8 w-8 place-items-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-white/10 sm:grid">
              <Menu className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-neutral-400">{topbarLabel(pathname)}</p>
              {title ? <h1 className="truncate text-base font-bold text-ink dark:text-white">{title}</h1> : null}
            </div>
            {actions ? <div className="hidden items-center gap-2 md:flex">{actions}</div> : null}
            <ThemeToggle />
            <Button variant="ghost" size="icon" title="Notifications" aria-label="Notifications" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-ember" />
            </Button>
            <button className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-white/10">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-orange-100 to-neutral-200 text-xs">
                {(user?.name ?? "John Doe")
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="hidden sm:inline">{user?.name ?? "John Doe"}</span>
              <ChevronDown className="hidden h-4 w-4 sm:block" />
            </button>
          </div>
        </header>

        <main className="px-4 pb-28 pt-5 sm:px-6 lg:px-4 lg:pb-10">
          {(title || subtitle) && (
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                {title ? <h2 className="text-2xl font-bold tracking-normal sm:text-3xl">{title}</h2> : null}
                {subtitle ? <p className="mt-1 max-w-2xl text-sm text-neutral-500 dark:text-neutral-300">{subtitle}</p> : null}
              </div>
              {actions ? <div className="flex items-center gap-2 md:hidden">{actions}</div> : null}
            </div>
          )}
          {children}
        </main>
      </div>

      <nav className="print-hidden fixed bottom-3 left-3 right-3 z-50 rounded-3xl bg-ink px-3 py-2 shadow-2xl dark:bg-white dark:text-ink lg:hidden">
        <div className="grid grid-cols-4 gap-1">
          {mobileItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href, item.label);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-semibold text-white/55 transition dark:text-ink/55",
                  active && "bg-white/10 text-white dark:bg-ink/10 dark:text-ink"
                )}
              >
                <Icon className="mb-1 h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <Link
        href="/create"
        className="print-hidden fixed bottom-24 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-white text-ember shadow-card ring-1 ring-black/5 dark:bg-[#2a2a2a] lg:hidden"
        title="Create assignment"
        aria-label="Create assignment"
      >
        <Plus className="h-5 w-5" />
      </Link>
    </div>
  );
}
