import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, Compass, GraduationCap, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Club Connect — Connect. Participate. Grow." },
      {
        name: "description",
        content:
          "Discover college clubs, events and communities that match your interests at Guru Nanak Dev Engineering College.",
      },
      { property: "og:title", content: "Club Connect — Connect. Participate. Grow." },
      {
        property: "og:description",
        content: "Discover college clubs, events and communities that match your interests.",
      },
    ],
  }),
  component: Home,
});

const features = [
  {
    icon: Users,
    title: "Club Discovery",
    body: "Find student clubs based on interests, categories and activities.",
  },
  {
    icon: CalendarRange,
    title: "Event Hub",
    body: "Discover upcoming college events and manage your event participation from one place.",
  },
  {
    icon: Compass,
    title: "Personalized Discover",
    body: "Get club and event recommendations based on your interests.",
  },
  {
    icon: GraduationCap,
    title: "Student Community",
    body: "Build your campus profile through club participation and events.",
  },
];

function Home() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const [clubs, events, colleges] = await Promise.all([
        supabase.from("clubs").select("id", { count: "exact", head: true }),
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .gte("event_date", todayISO()),
        supabase.from("colleges").select("id", { count: "exact", head: true }),
      ]);
      return {
        clubs: clubs.count ?? 0,
        events: events.count ?? 0,
        colleges: colleges.count ?? 0,
      };
    },
  });

  return (
    <main>
      <section className="mx-auto w-full max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pt-20 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="animate-[var(--animate-fade-in)]">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
              Built for college campuses
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
              CONNECT. <span className="text-primary">PARTICIPATE.</span>{" "}
              <span className="text-secondary">GROW.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Discover college clubs, events and communities that match your interests.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/clubs">Explore Clubs</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/events">Explore Events</Link>
              </Button>
              {user ? (
                <Button asChild size="lg" variant="ghost">
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : null}
            </div>

            <dl className="mt-10 flex flex-wrap gap-8">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Clubs listed</dt>
                <dd className="text-2xl font-semibold text-foreground">{stats?.clubs ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  Upcoming events
                </dt>
                <dd className="text-2xl font-semibold text-foreground">{stats?.events ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Colleges</dt>
                <dd className="text-2xl font-semibold text-foreground">{stats?.colleges ?? "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="relative hidden rounded-3xl border border-border bg-surface p-8 shadow-[var(--shadow-card)] lg:block">
            <div className="grid grid-cols-2 gap-4">
              {features.slice(0, 4).map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-background p-4 shadow-[var(--shadow-card)]"
                >
                  <f.icon className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-foreground">{f.title}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              One campus platform for clubs, events, memberships and participation history.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-foreground">What you can do here</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every capability below is live in the platform.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="h-full transition-shadow hover:shadow-[var(--shadow-float)]">
              <CardContent className="pt-2">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <f.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-5 rounded-3xl border border-border bg-surface p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Join with your college email</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Club Connect is college-exclusive. Verify with your institute email to participate.
            </p>
          </div>
          <Button asChild size="lg">
            <Link to={user ? "/dashboard" : "/college"}>
              {user ? "Go to Dashboard" : "Get started"}
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
