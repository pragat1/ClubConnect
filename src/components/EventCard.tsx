import { Link } from "@tanstack/react-router";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatEventDate, formatTime } from "@/lib/constants";

export type EventCardData = {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  start_time: string | null;
  location: string | null;
  image_url: string | null;
  capacity: number | null;
  registration_count: number;
  clubs?: { name: string } | null;
};

export function EventCard({
  event,
  registered,
}: {
  event: EventCardData;
  registered?: boolean | undefined;
}) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden pt-0 transition-shadow hover:shadow-[var(--shadow-float)]">
      {event.image_url ? (
        <img
          src={event.image_url}
          alt={`${event.title} banner`}
          loading="lazy"
          className="h-36 w-full object-cover"
        />
      ) : (
        <div className="flex h-24 w-full items-center justify-center border-b border-border bg-primary-soft">
          <CalendarDays className="size-7 text-primary" aria-hidden="true" />
        </div>
      )}
      <CardHeader className="gap-1">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline">{event.event_type}</Badge>
          {registered ? (
            <Badge className="bg-primary text-primary-foreground">Registered</Badge>
          ) : null}
        </div>
        <h3 className="mt-1 line-clamp-2 text-base font-semibold text-foreground">{event.title}</h3>
        {event.clubs?.name ? (
          <p className="text-sm text-muted-foreground">{event.clubs.name}</p>
        ) : null}
      </CardHeader>
      <CardContent className="flex-1 space-y-1.5 text-sm text-muted-foreground">
        <p className="inline-flex items-center gap-2">
          <CalendarDays className="size-4" aria-hidden="true" />
          {formatEventDate(event.event_date)}
        </p>
        {event.start_time ? (
          <p className="inline-flex items-center gap-2">
            <Clock className="size-4" aria-hidden="true" />
            {formatTime(event.start_time)}
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
          {event.capacity ? ` / ${event.capacity} seats` : ""}
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link to="/events/$id" params={{ id: event.id }}>
            View Event
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
