import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, Mail, Megaphone, Target, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { EventCard } from "@/components/EventCard";
import { SectionTitle } from "@/components/PageShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/constants";

export const Route = createFileRoute("/clubs/$id")({
  head: () => ({
    meta: [
      { title: "Club details — Club Connect" },
      { name: "description", content: "Club profile, upcoming events and membership." },
      { property: "og:title", content: "Club details — Club Connect" },
      { property: "og:description", content: "Club profile, upcoming events and membership." },
    ],
  }),
  component: ClubDetail,
});

function ClubDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: club, isLoading } = useQuery({
    queryKey: ["club", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clubs").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["club-events", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, clubs(name)")
        .eq("club_id", id)
        .gte("event_date", todayISO())
        .order("event_date");
      if (error) throw error;
      return data;
    },
  });

  const { data: announcements } = useQuery({
    queryKey: ["club-announcements", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("club_id", id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const { data: membership } = useQuery({
    queryKey: ["membership", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("club_memberships")
        .select("*")
        .eq("club_id", id)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const join = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("club_memberships")
        .insert({ club_id: id, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Club joined successfully.");
      queryClient.invalidateQueries();
    },
    onError: () => toast.error("Unable to join this club right now."),
  });

  const leave = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("club_memberships")
        .delete()
        .eq("club_id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("You left the club.");
      queryClient.invalidateQueries();
    },
    onError: () => toast.error("Unable to leave this club right now."),
  });

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-48 animate-pulse rounded-2xl bg-muted/50" />
      </main>
    );
  }

  if (!club) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={Users}
          title="This club could not be found."
          description="It may have been removed."
          actionLabel="Browse clubs"
          actionTo="/clubs"
        />
      </main>
    );
  }

  const isMember = !!membership;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="overflow-hidden pt-0">
        {club.banner_url ? (
          <img
            src={club.banner_url}
            alt={`${club.name} banner`}
            className="h-40 w-full object-cover"
          />
        ) : (
          <div className="h-20 w-full bg-primary-soft" />
        )}
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {club.logo_url ? (
            <img
              src={club.logo_url}
              alt={`${club.name} logo`}
              className="size-20 rounded-2xl border border-border object-cover"
            />
          ) : (
            <span className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-2xl font-semibold text-primary">
              {club.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-foreground">{club.name}</h1>
            <Badge variant="secondary" className="mt-2 bg-secondary-soft text-secondary">
              {club.category}
            </Badge>
            <p className="mt-3 text-sm text-muted-foreground">{club.description}</p>
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4" aria-hidden="true" />
              {club.member_count} {club.member_count === 1 ? "member" : "members"}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            {!user ? (
              <Button onClick={() => navigate({ to: "/college" })}>Sign in to join</Button>
            ) : isMember ? (
              <>
                <Button variant="secondary" disabled className="gap-2">
                  <Check className="size-4" /> Joined
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => leave.mutate()}
                  disabled={leave.isPending}
                >
                  Leave Club
                </Button>
              </>
            ) : (
              <Button onClick={() => join.mutate()} disabled={join.isPending}>
                Join Club
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>{club.full_description || club.description || "No description added yet."}</p>
            {club.objectives ? (
              <div>
                <h3 className="mb-1 inline-flex items-center gap-2 font-semibold text-foreground">
                  <Target className="size-4" aria-hidden="true" /> Objectives
                </h3>
                <p className="whitespace-pre-line">{club.objectives}</p>
              </div>
            ) : null}
            {club.activities ? (
              <div>
                <h3 className="mb-1 font-semibold text-foreground">Activities</h3>
                <p className="whitespace-pre-line">{club.activities}</p>
              </div>
            ) : null}
            {club.contact_email ? (
              <p className="inline-flex items-center gap-2">
                <Mail className="size-4" aria-hidden="true" />
                <a className="text-primary underline" href={`mailto:${club.contact_email}`}>
                  {club.contact_email}
                </a>
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-base">
              <Megaphone className="size-4" aria-hidden="true" /> Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(announcements ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            ) : (
              <ul className="space-y-4">
                {announcements!.map((a) => (
                  <li key={a.id}>
                    <p className="text-sm font-semibold text-foreground">{a.title}</p>
                    <p className="text-sm text-muted-foreground">{a.content}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-10">
        <SectionTitle>Upcoming events</SectionTitle>
        {(events ?? []).length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming events."
            description="This club has not scheduled any events yet."
            actionLabel="Browse all events"
            actionTo="/events"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events!.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <div className="mt-8">
        <Button asChild variant="ghost">
          <Link to="/clubs">Back to clubs</Link>
        </Button>
      </div>
    </main>
  );
}
