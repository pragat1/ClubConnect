import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClubCard } from "@/components/ClubCard";
import { EmptyState } from "@/components/EmptyState";
import { CardGridSkeleton, PageShell } from "@/components/PageShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/constants";

export const Route = createFileRoute("/clubs/")({
  head: () => ({
    meta: [
      { title: "Clubs — Club Connect" },
      {
        name: "description",
        content: "Browse student clubs by category, interest and activity on your campus.",
      },
      { property: "og:title", content: "Clubs — Club Connect" },
      { property: "og:description", content: "Browse student clubs on your campus." },
    ],
  }),
  component: ClubsPage,
});

function ClubsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("members");

  const { data: clubs, isLoading } = useQuery({
    queryKey: ["clubs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clubs").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: upcoming } = useQuery({
    queryKey: ["upcoming-events-by-club"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("club_id")
        .gte("event_date", todayISO());
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data) map[row.club_id] = (map[row.club_id] ?? 0) + 1;
      return map;
    },
  });

  const categories = useMemo(
    () => Array.from(new Set((clubs ?? []).map((c) => c.category))).sort(),
    [clubs],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = (clubs ?? []).filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q);
      const matchesCategory = category === "all" || c.category === category;
      return matchesQuery && matchesCategory;
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "newest")
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return b.member_count - a.member_count;
    });
    return list;
  }, [clubs, search, category, sort]);

  return (
    <PageShell
      title="Clubs"
      description="Find student clubs based on interests, categories and activities."
      action={
        user ? (
          <Button asChild variant="outline">
            <Link to="/admin/club">
              <Plus className="size-4" /> Create / manage a club
            </Link>
          </Button>
        ) : null
      }
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs by name, category or description"
            aria-label="Search clubs"
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-52" aria-label="Filter by category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="sm:w-44" aria-label="Sort clubs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="members">Most members</SelectItem>
            <SelectItem value="name">Name (A–Z)</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <CardGridSkeleton />
      ) : (clubs ?? []).length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clubs are available yet."
          description="Once a club administrator adds a club, it will appear here."
          actionLabel={user ? "Create a club" : "Sign in to create a club"}
          actionTo={user ? "/admin/club" : "/college"}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No clubs match your search."
          description="Try a different keyword or clear the category filter."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((club) => (
            <ClubCard key={club.id} club={club} upcomingEvents={upcoming?.[club.id] ?? 0} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
