import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/PageShell";
import { useRoles } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatEventDate, todayISO } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "College Admin — Club Connect" },
      { name: "description", content: "Institution-level management and analytics." },
      { property: "og:title", content: "College Admin — Club Connect" },
      { property: "og:description", content: "Institution-level management and analytics." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { data: roles, isLoading } = useRoles();
  if (isLoading) return <div className="mx-auto mt-10 h-40 max-w-5xl animate-pulse rounded-2xl bg-muted/50" />;
  if (!roles?.includes("college_admin"))
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState icon={ShieldAlert} title="College administrators only." description="Your account doesn't have access to this area." actionLabel="Go to Dashboard" actionTo="/dashboard" />
      </main>
    );
  return <AdminDashboard />;
}

function AdminDashboard() {
  const qc = useQueryClient();
  const today = todayISO();
  const [newInterest, setNewInterest] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [profiles, clubs, events, roles, interests] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, crn, branch, academic_year, is_premium, created_at").order("created_at", { ascending: false }),
        supabase.from("clubs").select("*").order("member_count", { ascending: false }),
        supabase.from("events").select("*, clubs(name)").order("event_date", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("interests").select("*").order("name"),
      ]);
      return { profiles: profiles.data ?? [], clubs: clubs.data ?? [], events: events.data ?? [], roles: roles.data ?? [], interests: interests.data ?? [] };
    },
  });

  const invalidate = () => qc.invalidateQueries();
  const run = (p: PromiseLike<{ error: unknown }>, ok: string) =>
    Promise.resolve(p).then(({ error }) => { if (error) toast.error("Action failed."); else { toast.success(ok); invalidate(); } });

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, has }: { userId: string; role: "club_admin" | "college_admin"; has: boolean }) =>
      run(has ? supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role) : supabase.from("user_roles").insert({ user_id: userId, role }), "Role updated."),
  });

  const upcoming = (data?.events ?? []).filter((e) => e.event_date >= today);
  const totalRegs = (data?.events ?? []).reduce((s, e) => s + e.registration_count, 0);
  const students = (data?.profiles ?? []).filter((p) => !userSearch || `${p.full_name} ${p.email} ${p.crn}`.toLowerCase().includes(userSearch.toLowerCase()));

  return (
    <PageShell title="College Admin" description="All metrics are calculated live from the database.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["Registered students", data?.profiles.length], ["Clubs", data?.clubs.length], ["Upcoming events", upcoming.length], ["Registrations", totalRegs]].map(([l, v]) => (
          <Card key={l as string}><CardContent><p className="text-xs uppercase text-muted-foreground">{l}</p><p className="text-3xl font-semibold">{v ?? "—"}</p></CardContent></Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base">Most active clubs</CardTitle></CardHeader><CardContent>
          {(data?.clubs ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No clubs have been added yet.</p> :
            data!.clubs.slice(0, 5).map((c) => <p key={c.id} className="flex justify-between py-1 text-sm"><span>{c.name}</span><span className="text-muted-foreground">{c.member_count} members</span></p>)}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Event participation</CardTitle></CardHeader><CardContent>
          {(data?.events ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No events yet.</p> :
            [...data!.events].sort((a, b) => b.registration_count - a.registration_count).slice(0, 5).map((e) => <p key={e.id} className="flex justify-between py-1 text-sm"><span>{e.title}</span><span className="text-muted-foreground">{e.registration_count} registered</span></p>)}
        </CardContent></Card>
      </div>

      <Tabs defaultValue="students" className="mt-8">
        <TabsList className="flex-wrap">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="clubs">Clubs</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="categories">Interests</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4 space-y-3">
          <Input placeholder="Search by name, email or CRN" aria-label="Search students" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="max-w-sm" />
          {students.length === 0 ? <EmptyState title="No students found." /> : (
            <Card><CardContent className="divide-y divide-border">
              {students.map((p) => {
                const r = (data?.roles ?? []).filter((x) => x.user_id === p.id).map((x) => x.role);
                return (
                  <div key={p.id} className="flex flex-col gap-2 py-3 lg:flex-row lg:items-center lg:justify-between">
                    <div><p className="text-sm font-medium">{p.full_name || "—"} <span className="text-xs text-muted-foreground">{r.join(", ")}{p.is_premium ? ", premium" : ""}</span></p>
                      <p className="text-xs text-muted-foreground">{[p.email, p.crn, p.branch, p.academic_year].filter(Boolean).join(" · ")}</p></div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => toggleRole.mutate({ userId: p.id, role: "club_admin", has: r.includes("club_admin") })}>{r.includes("club_admin") ? "Revoke club admin" : "Make club admin"}</Button>
                      <Button size="sm" variant="outline" onClick={() => toggleRole.mutate({ userId: p.id, role: "college_admin", has: r.includes("college_admin") })}>{r.includes("college_admin") ? "Revoke college admin" : "Make college admin"}</Button>
                      <Button size="sm" variant="outline" onClick={() => run(supabase.from("profiles").update({ is_premium: !p.is_premium }).eq("id", p.id), "Premium updated.")}>{p.is_premium ? "Remove premium" : "Grant premium"}</Button>
                    </div>
                  </div>
                );
              })}
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="clubs" className="mt-4 space-y-3">
          <Button asChild variant="outline"><Link to="/admin/club">Open club management</Link></Button>
          {(data?.clubs ?? []).length === 0 ? <EmptyState title="No clubs have been added yet." actionLabel="Create club" actionTo="/admin/club" /> :
            data!.clubs.map((c) => (
              <Card key={c.id}><CardContent className="flex items-center justify-between gap-3">
                <div><Link to="/clubs/$id" params={{ id: c.id }} className="font-medium hover:underline">{c.name}</Link><p className="text-xs text-muted-foreground">{c.category} · {c.member_count} members</p></div>
                <Button size="sm" variant="ghost" aria-label={`Delete ${c.name}`} onClick={() => { if (confirm(`Delete ${c.name}? This removes its events too.`)) run(supabase.from("clubs").delete().eq("id", c.id), "Club deleted."); }}><Trash2 className="size-4" /></Button>
              </CardContent></Card>
            ))}
        </TabsContent>

        <TabsContent value="events" className="mt-4 space-y-3">
          {(data?.events ?? []).length === 0 ? <EmptyState title="No events yet." /> :
            data!.events.map((e) => (
              <Card key={e.id}><CardContent className="flex items-center justify-between gap-3">
                <div><Link to="/events/$id" params={{ id: e.id }} className="font-medium hover:underline">{e.title}</Link><p className="text-xs text-muted-foreground">{e.clubs?.name} · {formatEventDate(e.event_date)} · {e.registration_count} registered</p></div>
                <Button size="sm" variant="ghost" aria-label={`Delete ${e.title}`} onClick={() => { if (confirm("Delete this event?")) run(supabase.from("events").delete().eq("id", e.id), "Event deleted."); }}><Trash2 className="size-4" /></Button>
              </CardContent></Card>
            ))}
        </TabsContent>

        <TabsContent value="categories" className="mt-4 space-y-3">
          <form className="flex max-w-sm gap-2" onSubmit={(e) => { e.preventDefault(); if (newInterest.trim()) run(supabase.from("interests").insert({ name: newInterest.trim() }), "Interest added.").then(() => setNewInterest("")); }}>
            <Input aria-label="New interest" placeholder="New interest" value={newInterest} onChange={(e) => setNewInterest(e.target.value)} />
            <Button type="submit">Add</Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {(data?.interests ?? []).map((i) => (
              <span key={i.id} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-sm">
                {i.name}
                <button aria-label={`Remove ${i.name}`} onClick={() => run(supabase.from("interests").delete().eq("id", i.id), "Interest removed.")}><Trash2 className="size-3.5 text-muted-foreground" /></button>
              </span>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="mt-4">
          <AnnouncementsList />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

function AnnouncementsList() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["all-announcements"],
    queryFn: async () => (await supabase.from("announcements").select("*, clubs(name)").order("created_at", { ascending: false })).data ?? [],
  });
  if ((data ?? []).length === 0) return <EmptyState title="No announcements yet." description="Club admins publish announcements from club management." />;
  return (
    <div className="space-y-3">
      {data!.map((a) => (
        <Card key={a.id}><CardContent className="flex items-start justify-between gap-3">
          <div><p className="font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{a.clubs?.name}</p><p className="text-sm text-muted-foreground">{a.content}</p></div>
          <Button size="sm" variant="ghost" aria-label="Delete announcement" onClick={async () => { const { error } = await supabase.from("announcements").delete().eq("id", a.id); if (error) toast.error("Action failed."); else { toast.success("Announcement removed."); qc.invalidateQueries(); } }}><Trash2 className="size-4" /></Button>
        </CardContent></Card>
      ))}
    </div>
  );
}
