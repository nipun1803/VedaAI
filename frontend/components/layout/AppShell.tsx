"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  Users,
  X
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/utils/cn";
import { useAssignmentStore } from "@/store/assignmentStore";
import { useAuthStore } from "@/store/authStore";
import { useMounted } from "@/hooks/useMounted";

interface AppShellProps {
  children: React.ReactNode;
  title?: React.ReactNode;
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, mounted, router]);

  if (hideChrome) {
    return <main>{children}</main>;
  }

  if (!mounted) {
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
      {/* ──────────── Desktop Sidebar ──────────── */}
      <aside className="print-hidden fixed left-4 top-4 z-40 hidden h-[calc(100vh-2rem)] w-[238px] rounded-2xl bg-white p-4 shadow-sidebar dark:bg-[#232323] lg:flex lg:flex-col">
        <Logo />

        {/* Create Assignment — outlined button matching screenshot */}
        <Link href="/create" className="mt-10">
          <button className="flex h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-ember bg-[#272727] px-4 text-sm font-bold text-white shadow-md transition-all hover:bg-[#1a1a1a] active:scale-[0.98]">
            <Sparkles className="h-4 w-4 text-ember fill-ember" />
            Create Assignment
          </button>
        </Link>

        {/* Navigation */}
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
                  active && "bg-neutral-100 font-semibold text-ink dark:bg-white/10 dark:text-white"
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

        {/* Bottom section: Settings + School Profile + Logout */}
        <div className="mt-auto space-y-3">
          <Link
            href="/settings"
            className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-ink dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>

          {/* School profile card */}
          <div className="rounded-xl bg-neutral-100 p-3 dark:bg-white/10">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-amber-200 to-orange-300 text-sm font-bold text-white">
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

      {/* ──────────── Main Content Area ──────────── */}
      <div className="min-h-screen lg:pl-[268px]">
        {/* ──────────── Top Header Bar ──────────── */}
        <header className="print-hidden sticky top-0 z-30 border-b border-black/5 bg-paper/85 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#181818]/85 sm:px-6 lg:px-4 lg:py-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm dark:bg-[#232323]">
            {/* Mobile: Logo */}
            <div className="flex items-center gap-2 lg:hidden">
              <Logo compact />
            </div>

            {/* Back button */}
            <button
              onClick={() => router.back()}
              className="hidden h-8 w-8 place-items-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white lg:grid"
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            {/* Grid/menu icon */}
            <div className="hidden h-8 w-8 place-items-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-white/10 sm:grid">
              <Menu className="h-4 w-4" />
            </div>

            {/* Page label */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-neutral-400">{topbarLabel(pathname)}</p>
              {title ? (
                typeof title === "string" ? (
                  <h1 className="hidden truncate text-base font-bold text-ink dark:text-white lg:block">{title}</h1>
                ) : (
                  <div className="hidden lg:block">{title}</div>
                )
              ) : null}
            </div>

            {/* Right side actions */}
            {actions ? <div className="hidden items-center gap-2 md:flex">{actions}</div> : null}

            {/* Notification bell */}
            <button
              className="relative grid h-9 w-9 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-ember" />
            </button>

            {/* Dark Mode Theme Toggle */}
            <ThemeToggle />

            {/* User avatar + name dropdown */}
            <button className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-white/10">
              <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-orange-100 to-neutral-200 text-xs font-bold text-ink">
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

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white lg:hidden"
              title="Menu"
              aria-label="Menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* ──────────── Page Content ──────────── */}
        <main className="px-4 pb-28 pt-5 sm:px-6 lg:px-4 lg:pb-10">
          {(title || subtitle) && (
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-3">
                {pathname !== "/" && (
                  <button
                    onClick={() => router.back()}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600 transition hover:bg-neutral-200 dark:bg-white/10 dark:text-white lg:hidden"
                    title="Go back"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <div>
                  {title ? (
                    typeof title === "string" ? (
                      <h2 className="text-2xl font-bold tracking-normal sm:text-3xl">{title}</h2>
                    ) : (
                      title
                    )
                  ) : null}
                  {subtitle ? <p className="mt-1 max-w-2xl text-sm text-neutral-500 dark:text-neutral-300">{subtitle}</p> : null}
                </div>
              </div>
              {actions ? <div className="flex items-center gap-2 md:hidden">{actions}</div> : null}
            </div>
          )}
          {children}
        </main>
      </div>

      {/* ──────────── Mobile Bottom Nav ──────────── */}
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

      {/* ──────────── Mobile FAB ──────────── */}
      <Link
        href="/create"
        className="print-hidden fixed bottom-24 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-white text-ember shadow-xl ring-1 ring-black/5 dark:bg-[#2a2a2a] lg:hidden active:scale-95 transition-all"
        title="Create assignment"
        aria-label="Create assignment"
      >
        <Plus className="h-6 w-6 stroke-[3]" />
      </Link>

      {/* ──────────── Mobile Navigation Drawer ──────────── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <aside className="relative flex w-[280px] max-w-[80vw] flex-col bg-white p-5 shadow-2xl dark:bg-[#232323] h-full animate-in slide-in-from-left duration-200">
            {/* Close Button & Logo */}
            <div className="flex items-center justify-between">
              <Logo />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/10"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="mt-8 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href, item.label);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-ink dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white",
                      active && "bg-neutral-100 font-semibold text-ink dark:bg-white/10 dark:text-white"
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

            {/* Bottom Section */}
            <div className="mt-auto space-y-3">
              <Link
                href="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-ink dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>

              {/* School profile */}
              <div className="rounded-xl bg-neutral-100 p-3 dark:bg-white/10">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-orange-300 text-xs font-bold text-white">
                    DP
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{user?.schoolName ?? "Delhi Public School"}</p>
                    <p className="truncate text-[10px] text-neutral-500 dark:text-neutral-300">Bokaro Steel City</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
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
        </div>
      )}
    </div>
  );
}
