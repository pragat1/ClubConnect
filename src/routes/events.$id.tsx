import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, Clock, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatEventDate, formatTime, todayISO } from "@/lib/constants";

export const Route = createFileRoute("/events/$id")({
  head: () => ({
    meta: [
      { title: "Event details — Club Connect" },
      { name: "description", content: "Event details, schedule and registration." },
      { property: "og:title", content: "Event details — Club Connect" },
      { property: "og:description", content: "Event details, schedule and registration." },
    ],
  }),
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, clubs(id, name, category)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: registration } = useQuery({
    queryKey: ["registration", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", id)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const register = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("event_registrations")
        .insert({ event_id: id, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event registration successful.");
      queryClient.invalidateQueries();
    },
    onError: () => toast.error("Unable to register for this event."),
  });

  const cancel = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("event_id", id)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registration cancelled.");
      queryClient.invalidateQueries();
    },
    onError: () => toast.error("Unable to cancel your registration."),
  });

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="h-48 animate-pulse rounded-2xl bg-muted/50" />
      </main>
    );
  }

  if (!event) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={CalendarDays}
          title="This event could not be found."
          actionLabel="Browse events"
          actionTo="/events"
        />
      </main>
    );
  }

  const today = todayISO();
  const isPast = event.event_date < today;
  const deadlinePassed = !!event.registration_deadline && event.registration_deadline < today;
  const isFull = !!event.capacity && event.registration_count >= event.capacity;
  const registered = !!registration;

  let blockedReason: string | null = null;
  if (isPast) blockedReason = "This event has already taken place.";
  else if (deadlinePassed) blockedReason = "The registration deadline has passed.";
  else if (isFull) blockedReason = "This event has reached its capacity.";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <Card className="overflow-hidden pt-0">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={`${event.title} banner`}
            className="h-52 w-full object-cover"
          />
        ) : (
          <div className="flex h-24 w-full items-center justify-center bg-primary-soft">
            <CalendarDays className="size-8 text-primary" aria-hidden="true" />
          </div>
        )}
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{event.event_type}</Badge>
            {isPast ? <Badge variant="secondary">Completed</Badge> : null}
            {registered ? <Badge className="bg-primary">Registered</Badge> : null}
          </div>
          <h1 className="mt-3 text-2xl font-bold text-foreground">{event.title}</h1>
          {event.clubs ? (
            <Link
              to="/clubs/$id"
              params={{ id: event.clubs.id }}
              className="mt-1 inline-block text-sm text-primary underline underline-offset-4"
            >
              {event.clubs.name}
            </Link>
          ) : null}

          <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <p className="inline-flex items-center gap-2">
              <CalendarDays className="size-4" aria-hidden="true" />
              {formatEventDate(event.event_date)}
            </p>
            {event.start_time ? (
              <p className="inline-flex items-center gap-2">
                <Clock className="size-4" aria-hidden="true" />
                {formatTime(event.start_time)}
                {event.end_time ? ` – ${formatTime(event.end_time)}` : ""}
              </p>
            ) : null}
            {event.location ? (
              <p className="inline-flex items-center gap-2">
                <MapPin className="size-4" aria-hidden="true" />
                {event.location}
              </p>
            ) : null}
            <p className="inline-flex items-center gap-2">
              <Users className="size-4" aria-hidden="true" />
              {event.registration_count} registered
              {event.capacity ? ` of ${event.capacity} seats` : ""}
            </p>
            {event.registration_deadline ? (
              <p>Registration closes {formatEventDate(event.registration_deadline)}</p>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {!user ? (
              <Button onClick={() => navigate({ to: "/college" })}>Sign in to register</Button>
            ) : registered ? (
              <>
                <Button variant="secondary" disabled className="gap-2">
                  <Check className="size-4" /> Registered
                </Button>
                {!isPast ? (
                  <Button
                    variant="ghost"
                    onClick={() => cancel.mutate()}
                    disabled={cancel.isPending}
                  >
                    Cancel registration
                  </Button>
                ) : null}
              </>
            ) : blockedReason ? (
              <p className="rounded-xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                {blockedReason}
              </p>
            ) : (
              <Button onClick={() => register.mutate()} disabled={register.isPending}>
                Register for Event
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">About this event</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {event.description || "No description provided."}
          </p>
        </CardContent>
      </Card>

      <div className="mt-8 flex gap-2">
        <Button asChild variant="ghost">
          <Link to="/events">Back to events</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/calendar">Calendar View</Link>
        </Button>
      </div>
    </main>
  );
}
