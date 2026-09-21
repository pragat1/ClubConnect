import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Compass, Flame, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClubCard } from "@/components/ClubCard";
import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/components/EventCard";
import { PageShell, SectionTitle } from "@/components/PageShell";
import { useAuth, useMyInterests } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/constants";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover — Club Connect" },
      {
        name: "description",
        content: "Trending categories, active clubs and recommendations based on your interests.",
      },
      { property: "og:title", content: "Discover — Club Connect" },
      { property: "og:description", content: "Trending categories and personal recommendations." },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { user } = useAuth();
  const { data: myInterests } = useMyInterests();

  const { data: clubs } = useQuery({
    queryKey: ["clubs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clubs").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["upcoming-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, clubs(name)")
        .gte("event_date", todayISO())
        .order("event_date");
      if (error) throw error;
      return data;
    },
  });

  const { data: myClubIds } = useQuery({
    queryKey: ["my-club-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_memberships")
        .select("club_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data.map((m) => m.club_id);
    },
  });

  const interestNames = useMemo(
    () => (myInterests ?? []).map((i) => i.interests?.name?.toLowerCase()).filter(Boolean) as string[],
    [myInterests],
  );

  const trendingCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of clubs ?? []) counts[c.category] = (counts[c.category] ?? 0) + c.member_count + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);
  }, [clubs]);

  const activeClubs = useMemo(() => {
    const eventCounts: Record<string, number> = {};
    for (const e of events ?? []) eventCounts[e.club_id] = (eventCounts[e.club_id] ?? 0) + 1;
    return [...(clubs ?? [])]
      .sort(
        (a, b) =>
          (eventCounts[b.id] ?? 0) * 3 + b.member_count - ((eventCounts[a.id] ?? 0) * 3 + a.member_count),
      )
      .slice(0, 3)
      .map((c) => ({ club: c, upcoming: eventCounts[c.id] ?? 0 }));
  }, [clubs, events]);

  const recommendedClubs = useMemo(() => {
    if (!user || interestNames.length === 0) return [];
    return (clubs ?? [])
      .filter((c) => !(myClubIds ?? []).includes(c.id))
      .filter((c) =>
        interestNames.some(
          (i) =>
            c.category.toLowerCase().includes(i) ||
            i.includes(c.category.toLowerCase()) ||
            c.name.toLowerCase().includes(i) ||
            (c.description ?? "").toLowerCase().includes(i),
        ),
      )
      .slice(0, 6);
  }, [clubs, interestNames, myClubIds, user]);

  const recommendedEvents = useMemo(() => {
    const joined = myClubIds ?? [];
    return (events ?? [])
      .map((e) => {
        let score = 0;
        if (joined.includes(e.club_id)) score += 5;
        if (interestNames.some((i) => e.event_type.toLowerCase().includes(i))) score += 3;
        if (interestNames.some((i) => e.title.toLowerCase().includes(i))) score += 2;
        return { e, score };
      })
      .filter((x) => (user ? x.score > 0 : true))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x) => x.e);
  }, [events, myClubIds, interestNames, user]);

  const noProfileSignals = !!user && interestNames.length === 0 && (myClubIds ?? []).length === 0;

  return (
    <PageShell
      title="Discover"
      description="Recommendations are calculated from your interests, joined clubs and live campus activity."
    >
      <section className="mb-10">
        <SectionTitle hint="Ranked by club activity">Trending categories</SectionTitle>
        {trendingCategories.length === 0 ? (
          <EmptyState
            icon={Flame}
            title="No categories yet."
            description="Categories appear as clubs are added to the platform."
            actionLabel="Explore clubs"
            actionTo="/clubs"
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {trendingCategories.map((c) => (
              <Badge key={c} variant="outline" className="rounded-full px-3 py-1.5 text-sm">
                {c}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <SectionTitle>Most active clubs</SectionTitle>
        {activeClubs.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No clubs have been added yet."
            actionLabel="Explore clubs"
            actionTo="/clubs"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeClubs.map(({ club, upcoming }) => (
              <ClubCard key={club.id} club={club} upcomingEvents={upcoming} />
            ))}
          </div>
        )}
      </section>

      {noProfileSignals ? (
        <Card className="mb-10 border-primary/30 bg-primary-soft/40">
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="inline-flex items-center gap-2 text-base font-semibold text-foreground">
                <Sparkles className="size-4 text-primary" aria-hidden="true" />
                Build your profile to get personalized recommendations.
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add interests and join a club so we can tailor suggestions to you.
              </p>
            </div>
            <Button asChild>
              <Link to="/profile">Complete Profile</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section className="mb-10">
        <SectionTitle>Recommended clubs</SectionTitle>
        {!user ? (
          <EmptyState
            icon={Compass}
            title="Sign in for personalized club recommendations."
            description="You can still browse every club on the platform."
            actionLabel="Sign in"
            actionTo="/college"
          />
        ) : recommendedClubs.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="Complete your profile to receive personalized recommendations."
            actionLabel="Complete Profile"
            actionTo="/profile"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedClubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Recommended events</SectionTitle>
        {recommendedEvents.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No recommendations yet."
            description="Join a club or add interests to see events matched to you."
            actionLabel="Explore events"
            actionTo="/events"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
