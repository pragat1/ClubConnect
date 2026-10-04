import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { BellOff, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Club Connect" },
      { name: "description", content: "Your club and event notifications." },
      { property: "og:title", content: "Notifications — Club Connect" },
      { property: "og:description", content: "Your club and event notifications." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.rpc("generate_my_reminders").then(() => qc.invalidateQueries({ queryKey: ["notifications"] }));
  }, [qc]);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "all", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("All notifications marked as read.");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => toast.error("Could not update notifications."),
  });

  const unread = (data ?? []).filter((n) => !n.is_read).length;

  return (
    <PageShell
      title="Notifications"
      description="Registration confirmations, reminders, club announcements and new events."
      action={
        unread > 0 ? (
          <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            <Check className="size-4" /> Mark all as read
          </Button>
        ) : null
      }
    >
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted/50" />
      ) : (data ?? []).length === 0 ? (
        <EmptyState icon={BellOff} title="You're all caught up." description="New notifications will appear here." actionLabel="Explore Events" actionTo="/events" />
      ) : (
        <ul className="space-y-3">
          {data!.map((n) => (
            <li key={n.id}>
              <Card className={cn(!n.is_read && "border-primary/40 bg-primary-soft/30")}>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {!n.is_read ? <span className="mr-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">New</span> : null}
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex gap-2">
                    {n.link ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (!n.is_read) markRead.mutate(n.id);
                          navigate({ to: n.link! });
                        }}
                      >
                        Open
                      </Button>
                    ) : null}
                    {!n.is_read ? (
                      <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)}>
                        Mark as read
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
