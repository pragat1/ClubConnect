import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatEventDate, formatTime, todayISO } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Event Calendar — Club Connect" },
      { name: "description", content: "Browse campus events by date on an interactive calendar." },
      { property: "og:title", content: "Event Calendar — Club Connect" },
      { property: "og:description", content: "Browse campus events by date." },
    ],
  }),
  component: CalendarPage,
});

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function CalendarPage() {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState<string>(todayISO());

  const { data: events } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, event_date, start_time, location, clubs(name)")
        .order("event_date");
      if (error) throw error;
      return data;
    },
  });

  const byDate = useMemo(() => {
    const map: Record<string, NonNullable<typeof events>> = {};
    for (const e of events ?? []) {
      (map[e.event_date] ||= []).push(e);
    }
    return map;
  }, [events]);

  const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const selectedEvents = byDate[selected] ?? [];
  const upcoming = (events ?? []).filter((e) => e.event_date >= todayISO()).slice(0, 5);

  function shift(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-4 gap-2">
        <Link to="/events" aria-label="Back to events">
          <ArrowLeft className="size-4" /> Back to events
        </Link>
      </Button>

      <h1 className="text-2xl font-bold text-foreground">Event Calendar</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Select a date to see the events scheduled on that day.
      </p>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{monthLabel}</CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => shift(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Next month" onClick={() => shift(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {WEEKDAYS.map((d, i) => (
              <div key={i} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = iso(cursor.year, cursor.month, day);
              const count = byDate[date]?.length ?? 0;
              const isSelected = selected === date;
              const isToday = date === todayISO();
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelected(date)}
                  aria-pressed={isSelected}
                  aria-label={`${formatEventDate(date)}${count ? `, ${count} events` : ", no events"}`}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-transparent hover:bg-muted",
                    isToday && !isSelected ? "border-primary/40 font-semibold text-primary" : "",
                  )}
                >
                  {day}
                  {count > 0 ? (
                    <span
                      className={cn(
                        "absolute bottom-1.5 size-1.5 rounded-full",
                        isSelected ? "bg-primary-foreground" : "bg-secondary",
                      )}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{formatEventDate(selected)}</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events scheduled for this date.</p>
          ) : (
            <ul className="space-y-3">
              {selectedEvents.map((e) => (
                <li key={e.id}>
                  <Link
                    to="/events/$id"
                    params={{ id: e.id }}
                    className="block rounded-xl border border-border p-3 transition-colors hover:bg-muted"
                  >
                    <p className="text-sm font-semibold text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {[e.clubs?.name, formatTime(e.start_time), e.location]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Upcoming events</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming events.</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <Link
                    to="/events/$id"
                    params={{ id: e.id }}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted"
                  >
                    <span className="text-sm font-medium text-foreground">{e.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatEventDate(e.event_date)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
