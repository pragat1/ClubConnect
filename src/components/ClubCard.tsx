import { Link } from "@tanstack/react-router";
import { CalendarDays, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export type ClubCardData = {
  id: string;
  name: string;
  category: string;
  description: string;
  logo_url: string | null;
  member_count: number;
};

export function ClubCard({ club, upcomingEvents = 0 }: { club: ClubCardData; upcomingEvents?: number }) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-float)]">
      <CardHeader className="gap-3">
        <div className="flex items-start gap-3">
          {club.logo_url ? (
            <img
              src={club.logo_url}
              alt={`${club.name} logo`}
              loading="lazy"
              className="size-12 shrink-0 rounded-xl border border-border object-cover"
            />
          ) : (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-base font-semibold text-primary">
              {club.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-foreground">{club.name}</h3>
            <Badge variant="secondary" className="mt-1 bg-secondary-soft text-secondary">
              {club.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {club.description || "No description provided yet."}
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" aria-hidden="true" />
            {club.member_count} {club.member_count === 1 ? "member" : "members"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            {upcomingEvents} upcoming
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link to="/clubs/$id" params={{ id: club.id }}>
            View Club
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
