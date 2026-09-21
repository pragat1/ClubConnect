import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, LayoutDashboard, LogOut, Menu, User as UserIcon, Users } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useProfile, useUnreadCount } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const links = [
  { to: "/clubs", label: "Clubs" },
  { to: "/events", label: "Events" },
  { to: "/discover", label: "Discover" },
];

export function Navbar() {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: unread } = useUnreadCount();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full px-3 pt-3 sm:px-6 sm:pt-5">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex w-full max-w-4xl items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-2 shadow-[var(--shadow-float)] backdrop-blur sm:px-4"
      >
        <Link to="/" className="flex shrink-0 items-center gap-2 rounded-full px-1 py-1">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Users className="size-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight sm:text-base">Club Connect</span>
        </Link>

        <div className="mx-auto hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-primary-soft text-primary" }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link
            to="/notifications"
            aria-label={
              unread ? `Notifications, ${unread} unread` : "Notifications"
            }
            className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Bell className="size-[18px]" aria-hidden="true" />
            {unread && unread > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-semibold leading-4 text-secondary-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full px-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {(profile?.full_name || user.email || "?").charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden max-w-24 truncate text-sm sm:inline">
                    {profile?.full_name?.split(" ")[0] ?? "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="size-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
                  <UserIcon className="size-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/", replace: true });
                  }}
                >
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="rounded-full">
              <Link to="/college">Sign In</Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="size-[18px]" />
          </Button>
        </div>
      </nav>

      <div
        className={cn(
          "mx-auto mt-2 max-w-4xl overflow-hidden rounded-2xl border border-border bg-background shadow-[var(--shadow-card)] md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <ul className="flex flex-col p-2">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
