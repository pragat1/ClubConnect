import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CalendarDays, Megaphone, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { PageShell } from "@/components/PageShell";
import { useAuth, useRoles } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { CLUB_CATEGORIES, EVENT_TYPES, formatEventDate, todayISO } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/admin/club")({
  head: () => ({
    meta: [
      { title: "Club Admin — Club Connect" },
      { name: "description", content: "Manage your club, events, announcements and members." },
      { property: "og:title", content: "Club Admin — Club Connect" },
      { property: "og:description", content: "Manage your club on Club Connect." },
    ],
  }),
  component: ClubAdmin,
});

type ClubForm = { name: string; category: string; description: string; full_description: string; objectives: string; activities: string; logo_url: string; banner_url: string; contact_email: string };
const emptyClub: ClubForm = { name: "", category: "", description: "", full_description: "", objectives: "", activities: "", logo_url: "", banner_url: "", contact_email: "" };
type EventForm = { id?: string; title: string; description: string; event_type: string; event_date: string; start_time: string; end_time: string; location: string; image_url: string; capacity: string; registration_deadline: string };
const emptyEvent: EventForm = { title: "", description: "", event_type: "Workshop", event_date: "", start_time: "", end_time: "", location: "", image_url: "", capacity: "", registration_deadline: "" };

const n = (v: string) => (v.trim() ? v.trim() : null);

function ClubAdmin() {
  const { user } = useAuth();
  const { data: roles } = useRoles();
  const qc = useQueryClient();
  const isCollegeAdmin = roles?.includes("college_admin");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: clubs, isLoading } = useQuery({
    queryKey: ["admin-clubs", user?.id, isCollegeAdmin],
    queryFn: async () => {
      if (isCollegeAdmin) return (await supabase.from("clubs").select("*").order("name")).data ?? [];
      const { data } = await supabase.from("club_memberships").select("clubs(*)").eq("user_id", user!.id).eq("role", "admin");
      const { data: own } = await supabase.from("clubs").select("*").eq("created_by", user!.id);
      const map = new Map<string, NonNullable<typeof own>[number]>();
      for (const c of own ?? []) map.set(c.id, c);
      for (const m of data ?? []) if (m.clubs) map.set(m.clubs.id, m.clubs);
      return Array.from(map.values());
    },
  });

  useEffect(() => {
    if (!selectedId && clubs && clubs.length) setSelectedId(clubs[0]!.id);
  }, [clubs, selectedId]);

  const club = clubs?.find((c) => c.id === selectedId);

  return (
    <PageShell
      title="Club Admin"
      description="Create and manage clubs you administer."
      action={<Button onClick={() => setCreating(true)}><Plus className="size-4" /> Create club</Button>}
    >
      {isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-muted/50" /> : (clubs ?? []).length === 0 ? (
        <EmptyState icon={Users} title="You don't manage any clubs yet." description="Create a club to start publishing events and announcements. You'll become its administrator." actionLabel="Create club" onAction={() => setCreating(true)} />
      ) : (
        <>
          {clubs!.length > 1 ? (
            <div className="mb-6 max-w-sm">
              <Label htmlFor="club-select">Club</Label>
              <Select value={selectedId ?? undefined} onValueChange={setSelectedId}>
                <SelectTrigger id="club-select"><SelectValue /></SelectTrigger>
                <SelectContent>{clubs!.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ) : null}
          {club ? <ClubManager key={club.id} club={club} /> : null}
        </>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create a club</DialogTitle></DialogHeader>
          <ClubFormFields
            initial={emptyClub}
            submitLabel="Create club"
            onSubmit={async (f) => {
              const { data: profile } = await supabase.from("profiles").select("college_id").eq("id", user!.id).maybeSingle();
              let collegeId = profile?.college_id;
              if (!collegeId) collegeId = (await supabase.from("colleges").select("id").limit(1).maybeSingle()).data?.id ?? null;
              if (!collegeId) { toast.error("No college is linked to your account."); return; }
              const { data, error } = await supabase.from("clubs").insert({
                college_id: collegeId, created_by: user!.id, name: f.name.trim(), category: f.category, description: f.description.trim(),
                full_description: n(f.full_description), objectives: n(f.objectives), activities: n(f.activities), logo_url: n(f.logo_url), banner_url: n(f.banner_url), contact_email: n(f.contact_email),
              }).select("id").single();
              if (error) { toast.error("Unable to create the club."); return; }
              toast.success("Club created.");
              setCreating(false);
              setSelectedId(data.id);
              qc.invalidateQueries();
            }}
          />
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

function ClubFormFields({ initial, submitLabel, onSubmit }: { initial: ClubForm; submitLabel: string; onSubmit: (f: ClubForm) => Promise<void> }) {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof ClubForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="space-y-3" onSubmit={async (e) => {
      e.preventDefault();
      if (!f.name.trim() || !f.category || !f.description.trim()) { toast.error("Name, category and short description are required."); return; }
      setBusy(true); await onSubmit(f); setBusy(false);
    }}>
      <div className="space-y-1.5"><Label htmlFor="c-name">Club name</Label><Input id="c-name" value={f.name} onChange={set("name")} required /></div>
      <div className="space-y-1.5"><Label htmlFor="c-cat">Category</Label>
        <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}><SelectTrigger id="c-cat"><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>{CLUB_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-1.5"><Label htmlFor="c-desc">Short description</Label><Input id="c-desc" value={f.description} onChange={set("description")} maxLength={200} required /></div>
      <div className="space-y-1.5"><Label htmlFor="c-full">Full description</Label><Textarea id="c-full" value={f.full_description} onChange={set("full_description")} /></div>
      <div className="space-y-1.5"><Label htmlFor="c-obj">Objectives</Label><Textarea id="c-obj" value={f.objectives} onChange={set("objectives")} /></div>
      <div className="space-y-1.5"><Label htmlFor="c-act">Activities</Label><Textarea id="c-act" value={f.activities} onChange={set("activities")} /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="c-logo">Logo URL</Label><Input id="c-logo" type="url" value={f.logo_url} onChange={set("logo_url")} /></div>
        <div className="space-y-1.5"><Label htmlFor="c-banner">Banner URL</Label><Input id="c-banner" type="url" value={f.banner_url} onChange={set("banner_url")} /></div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="c-email">Contact email</Label><Input id="c-email" type="email" value={f.contact_email} onChange={set("contact_email")} /></div>
      <Button type="submit" disabled={busy}>{submitLabel}</Button>
    </form>
  );
}

type Club = { id: string; college_id: string; name: string; category: string; description: string; full_description: string | null; objectives: string | null; activities: string | null; logo_url: string | null; banner_url: string | null; contact_email: string | null; member_count: number };

function ClubManager({ club }: { club: Club }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [eventForm, setEventForm] = useState<EventForm | null>(null);
  const [ann, setAnn] = useState({ title: "", content: "" });
  const [viewRegs, setViewRegs] = useState<string | null>(null);

  const { data: events } = useQuery({
    queryKey: ["admin-events", club.id],
    queryFn: async () => (await supabase.from("events").select("*").eq("club_id", club.id).order("event_date", { ascending: false })).data ?? [],
  });
  const { data: members } = useQuery({
    queryKey: ["admin-members", club.id],
    queryFn: async () => {
      const { data: m } = await supabase.from("club_memberships").select("*").eq("club_id", club.id).order("joined_at", { ascending: false });
      const ids = (m ?? []).map((x) => x.user_id);
      const { data: p } = ids.length ? await supabase.from("profiles").select("id, full_name, email, branch, academic_year").in("id", ids) : { data: [] };
      return (m ?? []).map((x) => ({ ...x, profile: (p ?? []).find((pp) => pp.id === x.user_id) }));
    },
  });
  const { data: announcements } = useQuery({
    queryKey: ["club-announcements", club.id],
    queryFn: async () => (await supabase.from("announcements").select("*").eq("club_id", club.id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: regs } = useQuery({
    queryKey: ["admin-regs", viewRegs],
    enabled: !!viewRegs,
    queryFn: async () => {
      const { data: r } = await supabase.from("event_registrations").select("*").eq("event_id", viewRegs!);
      const ids = (r ?? []).map((x) => x.user_id);
      const { data: p } = ids.length ? await supabase.from("profiles").select("id, full_name, email, crn").in("id", ids) : { data: [] };
      return (r ?? []).map((x) => ({ ...x, profile: (p ?? []).find((pp) => pp.id === x.user_id) }));
    },
  });

  const today = todayISO();
  const upcoming = (events ?? []).filter((e) => e.event_date >= today);
  const totalRegs = (events ?? []).reduce((s, e) => s + e.registration_count, 0);

  const saveEvent = useMutation({
    mutationFn: async (f: EventForm) => {
      const payload = {
        title: f.title.trim(), description: f.description.trim(), event_type: f.event_type, event_date: f.event_date,
        start_time: n(f.start_time), end_time: n(f.end_time), location: n(f.location), image_url: n(f.image_url),
        capacity: f.capacity ? Number(f.capacity) : null, registration_deadline: n(f.registration_deadline),
      };
      const r = f.id
        ? await supabase.from("events").update(payload).eq("id", f.id)
        : await supabase.from("events").insert({ ...payload, club_id: club.id, college_id: club.college_id, created_by: user!.id });
      if (r.error) throw r.error;
    },
    onSuccess: () => { toast.success("Event saved."); setEventForm(null); qc.invalidateQueries(); },
    onError: () => toast.error("Unable to save the event."),
  });
  const deleteEvent = useMutation({
    mutationFn: async (id: string) => { const r = await supabase.from("events").delete().eq("id", id); if (r.error) throw r.error; },
    onSuccess: () => { toast.success("Event deleted."); qc.invalidateQueries(); },
    onError: () => toast.error("Unable to delete the event."),
  });
  const postAnn = useMutation({
    mutationFn: async () => { const r = await supabase.from("announcements").insert({ club_id: club.id, title: ann.title.trim(), content: ann.content.trim(), created_by: user!.id }); if (r.error) throw r.error; },
    onSuccess: () => { toast.success("Announcement published."); setAnn({ title: "", content: "" }); qc.invalidateQueries(); },
    onError: () => toast.error("Unable to publish the announcement."),
  });
  const delAnn = useMutation({
    mutationFn: async (id: string) => { const r = await supabase.from("announcements").delete().eq("id", id); if (r.error) throw r.error; },
    onSuccess: () => qc.invalidateQueries(),
  });
  const setMemberRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => { const r = await supabase.from("club_memberships").update({ role }).eq("id", id); if (r.error) throw r.error; },
    onSuccess: () => { toast.success("Member updated."); qc.invalidateQueries(); },
    onError: () => toast.error("Unable to update member."),
  });
  const removeMember = useMutation({
    mutationFn: async (id: string) => { const r = await supabase.from("club_memberships").delete().eq("id", id); if (r.error) throw r.error; },
    onSuccess: () => { toast.success("Member removed."); qc.invalidateQueries(); },
    onError: () => toast.error("Unable to remove member."),
  });
  const updateClub = async (f: ClubForm) => {
    const r = await supabase.from("clubs").update({
      name: f.name.trim(), category: f.category, description: f.description.trim(), full_description: n(f.full_description), objectives: n(f.objectives),
      activities: n(f.activities), logo_url: n(f.logo_url), banner_url: n(f.banner_url), contact_email: n(f.contact_email),
    }).eq("id", club.id);
    if (r.error) toast.error("Unable to update club."); else { toast.success("Club updated."); qc.invalidateQueries(); }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{club.name}</h2>
        <Button asChild variant="ghost" size="sm"><Link to="/clubs/$id" params={{ id: club.id }}>View public page</Link></Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent><p className="text-xs uppercase text-muted-foreground">Total members</p><p className="text-3xl font-semibold">{club.member_count}</p></CardContent></Card>
        <Card><CardContent><p className="text-xs uppercase text-muted-foreground">Upcoming events</p><p className="text-3xl font-semibold">{upcoming.length}</p></CardContent></Card>
        <Card><CardContent><p className="text-xs uppercase text-muted-foreground">Event registrations</p><p className="text-3xl font-semibold">{totalRegs}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="events" className="mt-8">
        <TabsList className="flex-wrap">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="info">Club info</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-4 space-y-3">
          <Button onClick={() => setEventForm({ ...emptyEvent })}><Plus className="size-4" /> Create event</Button>
          {(events ?? []).length === 0 ? <EmptyState icon={CalendarDays} title="No events yet." description="Create your club's first event." /> :
            events!.map((e) => (
              <Card key={e.id}><CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-medium">{e.title}</p><p className="text-sm text-muted-foreground">{formatEventDate(e.event_date)} · {e.event_type} · {e.registration_count} registered{e.capacity ? ` / ${e.capacity}` : ""}</p></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setViewRegs(e.id)}>Registrations</Button>
                  <Button size="sm" variant="outline" aria-label={`Edit ${e.title}`} onClick={() => setEventForm({ id: e.id, title: e.title, description: e.description, event_type: e.event_type, event_date: e.event_date, start_time: e.start_time?.slice(0, 5) ?? "", end_time: e.end_time?.slice(0, 5) ?? "", location: e.location ?? "", image_url: e.image_url ?? "", capacity: e.capacity?.toString() ?? "", registration_deadline: e.registration_deadline ?? "" })}><Pencil className="size-4" /></Button>
                  <Button size="sm" variant="outline" aria-label={`Delete ${e.title}`} onClick={() => { if (confirm("Delete this event?")) deleteEvent.mutate(e.id); }}><Trash2 className="size-4" /></Button>
                </div>
              </CardContent></Card>
            ))}
        </TabsContent>

        <TabsContent value="announcements" className="mt-4 space-y-4">
          <Card><CardHeader><CardTitle className="inline-flex items-center gap-2 text-base"><Megaphone className="size-4" /> New announcement</CardTitle></CardHeader>
            <CardContent><form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (ann.title.trim()) postAnn.mutate(); }}>
              <div className="space-y-1.5"><Label htmlFor="a-title">Title</Label><Input id="a-title" value={ann.title} onChange={(e) => setAnn({ ...ann, title: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label htmlFor="a-content">Message</Label><Textarea id="a-content" value={ann.content} onChange={(e) => setAnn({ ...ann, content: e.target.value })} /></div>
              <Button type="submit" disabled={postAnn.isPending}>Publish to members</Button>
            </form></CardContent></Card>
          {(announcements ?? []).map((a) => (
            <Card key={a.id}><CardContent className="flex items-start justify-between gap-3">
              <div><p className="font-medium">{a.title}</p><p className="text-sm text-muted-foreground">{a.content}</p></div>
              <Button size="sm" variant="ghost" aria-label="Delete announcement" onClick={() => delAnn.mutate(a.id)}><Trash2 className="size-4" /></Button>
            </CardContent></Card>
          ))}
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          {(members ?? []).length === 0 ? <EmptyState icon={Users} title="No members yet." /> : (
            <Card><CardContent className="divide-y divide-border">
              {members!.map((m) => (
                <div key={m.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-sm font-medium">{m.profile?.full_name || "Student"} {m.role === "admin" ? <span className="text-xs text-primary">(admin)</span> : null}</p>
                    <p className="text-xs text-muted-foreground">{[m.profile?.email, m.profile?.branch, m.profile?.academic_year].filter(Boolean).join(" · ")}</p></div>
                  {m.user_id !== user?.id ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setMemberRole.mutate({ id: m.id, role: m.role === "admin" ? "member" : "admin" })}>{m.role === "admin" ? "Remove admin" : "Make admin"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => removeMember.mutate(m.id)}>Remove</Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <Card><CardContent>
            <ClubFormFields initial={{ name: club.name, category: club.category, description: club.description, full_description: club.full_description ?? "", objectives: club.objectives ?? "", activities: club.activities ?? "", logo_url: club.logo_url ?? "", banner_url: club.banner_url ?? "", contact_email: club.contact_email ?? "" }} submitLabel="Save club" onSubmit={updateClub} />
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!eventForm} onOpenChange={(o) => !o && setEventForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{eventForm?.id ? "Edit event" : "Create event"}</DialogTitle></DialogHeader>
          {eventForm ? (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!eventForm.title.trim() || !eventForm.event_date) { toast.error("Title and date are required."); return; } saveEvent.mutate(eventForm); }}>
              <div className="space-y-1.5"><Label htmlFor="e-title">Title</Label><Input id="e-title" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label htmlFor="e-type">Event type</Label>
                <Select value={eventForm.event_type} onValueChange={(v) => setEventForm({ ...eventForm, event_type: v })}><SelectTrigger id="e-type"><SelectValue /></SelectTrigger>
                  <SelectContent>{EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label htmlFor="e-desc">Description</Label><Textarea id="e-desc" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} /></div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5"><Label htmlFor="e-date">Date</Label><Input id="e-date" type="date" value={eventForm.event_date} onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })} required /></div>
                <div className="space-y-1.5"><Label htmlFor="e-start">Start</Label><Input id="e-start" type="time" value={eventForm.start_time} onChange={(e) => setEventForm({ ...eventForm, start_time: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="e-end">End</Label><Input id="e-end" type="time" value={eventForm.end_time} onChange={(e) => setEventForm({ ...eventForm, end_time: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="e-loc">Location</Label><Input id="e-loc" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} /></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="e-cap">Capacity (optional)</Label><Input id="e-cap" type="number" min={1} value={eventForm.capacity} onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="e-dl">Registration deadline</Label><Input id="e-dl" type="date" value={eventForm.registration_deadline} onChange={(e) => setEventForm({ ...eventForm, registration_deadline: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="e-img">Banner image URL</Label><Input id="e-img" type="url" value={eventForm.image_url} onChange={(e) => setEventForm({ ...eventForm, image_url: e.target.value })} /></div>
              <Button type="submit" disabled={saveEvent.isPending}>Save event</Button>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewRegs} onOpenChange={(o) => !o && setViewRegs(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrations</DialogTitle></DialogHeader>
          {(regs ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No registrations yet.</p> : (
            <ul className="max-h-80 divide-y divide-border overflow-y-auto">
              {regs!.map((r) => <li key={r.id} className="py-2 text-sm"><span className="font-medium">{r.profile?.full_name || "Student"}</span> <span className="text-muted-foreground">· {r.profile?.crn} · {r.profile?.email}</span></li>)}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
