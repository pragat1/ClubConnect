import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bell, CalendarDays, Crown, Shield, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClubCard } from "@/components/ClubCard";
import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/components/EventCard";
import { SectionTitle } from "@/components/PageShell";
import { useAuth, useProfile, useRoles } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Club Connect" },
      { name: "description", content: "Your clubs, events and notifications." },
      { property: "og:title", content: "Dashboard — Club Connect" },
      { property: "og:description", content: "Your personal Club Connect dashboard." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: roles } = useRoles();
  const qc = useQueryClient();

  useEffect(() => {
    supabase.rpc("generate_my_reminders").then(({ data }) => {
      if (data && data > 0) qc.invalidateQueries({ queryKey: ["notifications"] });
    });
  }, [qc]);

  const { data: memberships } = useQuery({
    queryKey: ["my-clubs", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_memberships")
        .select("club_id, role, clubs(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: registrations } = useQuery({
    queryKey: ["my-registration-events", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("event_id, events(*, clubs(name))")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications", "recent", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: allClubs } = useQuery({
    queryKey: ["clubs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clubs").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: interests } = useQuery({
    queryKey: ["my-interests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_interests")
        .select("interests(name)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data.map((d) => d.interests?.name?.toLowerCase() ?? "").filter(Boolean);
    },
  });

  const today = todayISO();
  const joinedIds = (memberships ?? []).map((m) => m.club_id);
  const registeredIds = (registrations ?? []).map((r) => r.event_id);
  const upcomingRegistered = (registrations ?? [])
    .map((r) => r.events)
    .filter((e): e is NonNullable<typeof e> => !!e && e.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const pastCount = (registrations ?? []).filter((r) => r.events && r.events.event_date < today).length;

  const recommendedClubs = (allClubs ?? [])
    .filter((c) => !joinedIds.includes(c.id))
    .filter((c) =>
      (interests ?? []).some(
        (i) => c.category.toLowerCase().includes(i) || i.includes(c.category.toLowerCase()),
      ),
    )
    .slice(0, 3);

  const { data: recommendedEvents } = useQuery({
    queryKey: ["dash-rec-events", joinedIds.join(",")],
    enabled: joinedIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, clubs(name)")
        .in("club_id", joinedIds)
        .gte("event_date", today)
        .order("event_date")
        .limit(6);
      if (error) throw error;
      return data;
    },
  });
  const recEvents = (recommendedEvents ?? []).filter((e) => !registeredIds.includes(e.id)).slice(0, 3);

  const isAdmin = roles?.includes("college_admin");
  const isClubAdmin = roles?.includes("club_admin");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Welcome, {profile?.full_name || "student"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile?.colleges?.name ?? "Your campus"}
            {profile?.is_premium ? " · Premium member" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin ? (
            <Button asChild variant="outline">
              <Link to="/admin"><Shield className="size-4" /> College admin</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link to="/admin/club"><Users className="size-4" /> {isClubAdmin ? "Manage clubs" : "Start a club"}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/premium"><Crown className="size-4" /> Premium</Link>
          </Button>
        </div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Clubs joined" value={joinedIds.length} />
        <Stat label="Upcoming registrations" value={upcomingRegistered.length} />
        <Stat label="Events attended / past" value={pastCount} />
      </section>

      <section className="mt-10">
        <SectionTitle>Upcoming registered events</SectionTitle>
        {upcomingRegistered.length === 0 ? (
          <EmptyState icon={CalendarDays} title="You haven't registered for any events yet." actionLabel="Explore Events" actionTo="/events" />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingRegistered.map((e) => <EventCard key={e.id} event={e} registered />)}
          </div>
        )}
      </section>

      <section className="mt-10">
        <SectionTitle>Joined clubs</SectionTitle>
        {(memberships ?? []).length === 0 ? (
          <EmptyState icon={Users} title="You haven't joined any clubs yet." actionLabel="Explore Clubs" actionTo="/clubs" />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {memberships!.map((m) => (m.clubs ? <ClubCard key={m.club_id} club={m.clubs} /> : null))}
          </div>
        )}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle>Recommended clubs</SectionTitle>
          {recommendedClubs.length === 0 ? (
            <EmptyState title="Complete your profile to receive personalized recommendations." actionLabel="Complete Profile" actionTo="/profile" />
          ) : (
            <div className="grid gap-4">
              {recommendedClubs.map((c) => <ClubCard key={c.id} club={c} />)}
            </div>
          )}
        </div>
        <div>
          <SectionTitle>Recommended events</SectionTitle>
          {recEvents.length === 0 ? (
            <EmptyState title="No recommended events yet." description="Join clubs to see their upcoming events here." actionLabel="Discover" actionTo="/discover" />
          ) : (
            <div className="grid gap-4">
              {recEvents.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          )}
        </div>
      </section>

      <section className="mt-10">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent notifications</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link to="/notifications">View all</Link></Button>
          </CardHeader>
          <CardContent>
            {(notifications ?? []).length === 0 ? (
              <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Bell className="size-4" /> You're all caught up.</p>
            ) : (
              <ul className="divide-y divide-border">
                {notifications!.map((n) => (
                  <li key={n.id} className="py-3">
                    <p className="text-sm font-medium text-foreground">{!n.is_read ? "● " : ""}{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
