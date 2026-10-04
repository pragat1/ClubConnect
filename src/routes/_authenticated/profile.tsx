import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Award, CalendarDays, Crown, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, useProfile } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ACADEMIC_YEARS, BRANCHES, formatEventDate, todayISO } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — Club Connect" },
      { name: "description", content: "Manage your Club Connect profile and interests." },
      { property: "og:title", content: "Your Profile — Club Connect" },
      { property: "og:description", content: "Manage your Club Connect profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [form, setForm] = useState({ full_name: "", branch: "", academic_year: "", bio: "", avatar_url: "" });
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (profile)
      setForm({
        full_name: profile.full_name ?? "",
        branch: profile.branch ?? "",
        academic_year: profile.academic_year ?? "",
        bio: profile.bio ?? "",
        avatar_url: profile.avatar_url ?? "",
      });
  }, [profile]);

  const { data: interests } = useQuery({
    queryKey: ["interests"],
    queryFn: async () => (await supabase.from("interests").select("*").order("name")).data ?? [],
  });
  const { data: mine } = useQuery({
    queryKey: ["my-interest-ids", user?.id],
    queryFn: async () =>
      ((await supabase.from("user_interests").select("interest_id").eq("user_id", user!.id)).data ?? []).map((r) => r.interest_id),
  });
  useEffect(() => { if (mine) setSelected(mine); }, [mine]);

  const { data: clubs } = useQuery({
    queryKey: ["profile-clubs", user?.id],
    queryFn: async () =>
      (await supabase.from("club_memberships").select("role, joined_at, clubs(id, name, category)").eq("user_id", user!.id)).data ?? [],
  });
  const { data: regs } = useQuery({
    queryKey: ["profile-regs", user?.id],
    queryFn: async () =>
      (await supabase.from("event_registrations").select("status, events(id, title, event_date)").eq("user_id", user!.id)).data ?? [],
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({
        full_name: form.full_name.trim(),
        branch: form.branch || null,
        academic_year: form.academic_year || null,
        bio: form.bio.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
      }).eq("id", user!.id);
      if (error) throw error;
      const toAdd = selected.filter((i) => !(mine ?? []).includes(i));
      const toRemove = (mine ?? []).filter((i) => !selected.includes(i));
      if (toAdd.length) {
        const r = await supabase.from("user_interests").insert(toAdd.map((interest_id) => ({ user_id: user!.id, interest_id })));
        if (r.error) throw r.error;
      }
      if (toRemove.length) {
        const r = await supabase.from("user_interests").delete().eq("user_id", user!.id).in("interest_id", toRemove);
        if (r.error) throw r.error;
      }
    },
    onSuccess: () => { toast.success("Profile updated successfully."); qc.invalidateQueries(); },
    onError: () => toast.error("Unable to update your profile."),
  });

  const today = todayISO();
  const upcoming = (regs ?? []).filter((r) => r.events && r.events.event_date >= today);
  const past = (regs ?? []).filter((r) => r.events && r.events.event_date < today);
  const achievements = [
    (clubs ?? []).length >= 1 && "Joined first club",
    (clubs ?? []).length >= 3 && "Member of 3+ clubs",
    (regs ?? []).length >= 1 && "Registered for first event",
    past.length >= 5 && "Participated in 5+ events",
    (clubs ?? []).some((c) => c.role === "admin") && "Club administrator",
  ].filter(Boolean) as string[];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <Card>
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={`${profile.full_name} profile photo`} className="size-20 rounded-full border border-border object-cover" />
          ) : (
            <span className="flex size-20 items-center justify-center rounded-full bg-primary-soft text-2xl font-semibold text-primary">
              {(profile?.full_name || "?").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{profile?.full_name}</h1>
            <p className="text-sm text-muted-foreground">{profile?.colleges?.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">CRN {profile?.crn ?? "—"} · {profile?.email}</p>
            <p className="text-sm text-muted-foreground">{[profile?.branch, profile?.academic_year].filter(Boolean).join(" · ")}</p>
          </div>
          <Button asChild variant="secondary"><Link to="/premium"><Crown className="size-4" /> {profile?.is_premium ? "Premium" : "Premium plans"}</Link></Button>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">Edit profile</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
              <div className="space-y-1.5"><Label htmlFor="p-name">Full name</Label><Input id="p-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="p-branch">Branch</Label>
                  <Select value={form.branch} onValueChange={(v) => setForm({ ...form, branch: v })}><SelectTrigger id="p-branch"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{BRANCHES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label htmlFor="p-year">Academic year</Label>
                  <Select value={form.academic_year} onValueChange={(v) => setForm({ ...form, academic_year: v })}><SelectTrigger id="p-year"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{ACADEMIC_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="p-avatar">Profile photo URL</Label><Input id="p-avatar" type="url" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="p-bio">Bio</Label><Textarea id="p-bio" value={form.bio} maxLength={500} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
              <fieldset>
                <legend className="text-sm font-medium">Interests</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(interests ?? []).map((i) => {
                    const active = selected.includes(i.id);
                    return (
                      <button key={i.id} type="button" aria-pressed={active}
                        onClick={() => setSelected((s) => active ? s.filter((x) => x !== i.id) : [...s, i.id])}
                        className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors", active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-muted")}>
                        {i.name}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <p className="text-xs text-muted-foreground">CRN and college email can only be changed by a college administrator.</p>
              <Button type="submit" disabled={save.isPending}>Save changes</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="inline-flex items-center gap-2 text-base"><Award className="size-4" /> Achievements</CardTitle></CardHeader>
            <CardContent>
              {achievements.length === 0 ? <p className="text-sm text-muted-foreground">Join clubs and attend events to earn achievements.</p> : (
                <div className="flex flex-wrap gap-2">{achievements.map((a) => <Badge key={a} variant="secondary" className="bg-secondary-soft text-secondary">{a}</Badge>)}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="inline-flex items-center gap-2 text-base"><Users className="size-4" /> Joined clubs</CardTitle></CardHeader>
            <CardContent>
              {(clubs ?? []).length === 0 ? <p className="text-sm text-muted-foreground">You haven't joined any clubs yet.</p> : (
                <ul className="space-y-2">{clubs!.map((c) => c.clubs && (
                  <li key={c.clubs.id}><Link to="/clubs/$id" params={{ id: c.clubs.id }} className="text-sm text-primary underline-offset-4 hover:underline">{c.clubs.name}</Link>{c.role === "admin" ? <span className="ml-2 text-xs text-muted-foreground">(admin)</span> : null}</li>
                ))}</ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="inline-flex items-center gap-2 text-base"><CalendarDays className="size-4" /> Events & participation</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-medium">Registered ({upcoming.length})</p>
              {upcoming.length === 0 ? <p className="text-muted-foreground">You haven't registered for any events yet.</p> :
                upcoming.map((r) => r.events && <Link key={r.events.id} to="/events/$id" params={{ id: r.events.id }} className="block text-primary hover:underline">{r.events.title} · {formatEventDate(r.events.event_date)}</Link>)}
              <p className="pt-2 font-medium">History ({past.length})</p>
              {past.length === 0 ? <p className="text-muted-foreground">No past events yet.</p> :
                past.map((r) => r.events && <p key={r.events.id} className="text-muted-foreground">{r.events.title} · {formatEventDate(r.events.event_date)}</p>)}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
