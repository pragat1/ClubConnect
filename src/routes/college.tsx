import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { PageShell, CardGridSkeleton } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/college")({
  head: () => ({
    meta: [
      { title: "Choose Your College — Club Connect" },
      {
        name: "description",
        content: "Select your institution to sign in or register on Club Connect.",
      },
      { property: "og:title", content: "Choose Your College — Club Connect" },
      { property: "og:description", content: "Select your institution to continue." },
    ],
  }),
  component: CollegePage,
});

function CollegePage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["colleges"],
    queryFn: async () => {
      const { data, error } = await supabase.from("colleges").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <PageShell
      title="Choose Your College"
      description="Club Connect is college-exclusive. Pick your institution to continue to sign in or registration."
    >
      {isLoading ? (
        <CardGridSkeleton count={2} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No colleges are available yet."
          description="Institutions are added by the platform administrator."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {data.map((college) => (
            <Card key={college.id} className="transition-shadow hover:shadow-[var(--shadow-float)]">
              <CardContent className="flex items-center gap-4">
                {college.logo_url ? (
                  <img
                    src={college.logo_url}
                    alt={`${college.name} logo`}
                    className="size-14 rounded-xl border border-border object-contain"
                  />
                ) : (
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Building2 className="size-6" aria-hidden="true" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-foreground">{college.name}</h2>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {college.city}, {college.state}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Email domain: @{college.domain}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    navigate({ to: "/auth", search: { college: college.id, mode: "signin" } })
                  }
                >
                  Continue <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
