import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarDays, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/components/EventCard";
import { CardGridSkeleton, PageShell } from "@/components/PageShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/constants";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Events — Club Connect" },
      {
        name: "description",
        content: "Discover upcoming college events and manage your participation.",
      },
      { property: "og:title", content: "Events — Club Connect" },
      { property: "og:description", content: "Discover upcoming college events." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [club, setClub] = useState("all");
  const [when, setWhen] = useState("upcoming");

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, clubs(name)")
        .order("event_date");
      if (error) throw error;
      return data;
    },
  });

  const { data: myRegistrations } = useQuery({
    queryKey: ["my-registrations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("event_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data.map((r) => r.event_id);
    },
  });

  const clubOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of events ?? []) if (e.clubs?.name) map.set(e.club_id, e.clubs.name);
    return Array.from(map.entries());
  }, [events]);

  const types = useMemo(
    () => Array.from(new Set((events ?? []).map((e) => e.event_type))).sort(),
    [events],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const today = todayISO();
    return (events ?? []).filter((e) => {
      const matchesQuery =
        !q ||
        e.title.toLowerCase().includes(q) ||
        (e.clubs?.name ?? "").toLowerCase().includes(q) ||
        e.event_type.toLowerCase().includes(q) ||
        (e.location ?? "").toLowerCase().includes(q);
      const matchesType = type === "all" || e.event_type === type;
      const matchesClub = club === "all" || e.club_id === club;
      const matchesWhen =
        when === "all" ||
        (when === "upcoming" ? e.event_date >= today : e.event_date < today);
      return matchesQuery && matchesType && matchesClub && matchesWhen;
    });
  }, [events, search, type, club, when]);

  return (
    <PageShell
      title="Events"
      description="Discover upcoming college events and manage your event participation from one place."
      action={
        <Button asChild variant="outline">
          <Link to="/calendar">
            <CalendarDays className="size-4" /> Calendar View
          </Link>
        </Button>
      }
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, club, type or location"
            aria-label="Search events"
            className="pl-9"
          />
        </div>
        <Select value={when} onValueChange={setWhen}>
          <SelectTrigger aria-label="Filter by date">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past</SelectItem>
            <SelectItem value="all">All dates</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger aria-label="Filter by event type">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {clubOptions.length > 0 ? (
          <Select value={club} onValueChange={setClub}>
            <SelectTrigger aria-label="Filter by club" className="lg:col-span-1">
              <SelectValue placeholder="All clubs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clubs</SelectItem>
              {clubOptions.map(([cid, name]) => (
                <SelectItem key={cid} value={cid}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {isLoading ? (
        <CardGridSkeleton />
      ) : (events ?? []).length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No upcoming events."
          description="Events created by clubs will appear here."
          actionLabel="Explore clubs"
          actionTo="/clubs"
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No events match your filters."
          description="Try another keyword or reset the filters."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              registered={myRegistrations?.includes(event.id)}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
