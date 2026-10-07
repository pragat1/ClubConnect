import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarDays, Loader2, Sparkles, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageShell, SectionTitle } from "@/components/PageShell";
import { recommendFromText } from "@/lib/recommend.functions";
import { formatEventDate } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/match")({
  head: () => ({
    meta: [
      { title: "AI Club Match — Club Connect" },
      { name: "description", content: "Describe your interests and goals to get AI-picked clubs and events at GNDEC." },
      { property: "og:title", content: "AI Club Match — Club Connect" },
      { property: "og:description", content: "Personal club and event suggestions with explanations." },
    ],
  }),
  component: MatchPage,
});

function MatchPage() {
  const [text, setText] = useState("");
  const run = useServerFn(recommendFromText);
  const m = useMutation({ mutationFn: (t: string) => run({ data: { text: t } }) });

  return (
    <PageShell title="AI Club Match" description="Tell us what you enjoy and what you want to achieve. We'll suggest clubs and upcoming events, and explain why.">
      <Card className="mb-8">
        <CardContent className="space-y-3">
          <Textarea rows={5} maxLength={1500} value={text} onChange={(e) => setText(e.target.value)}
            placeholder="e.g. I'm in 2nd year CSE, love building robots and want to get better at public speaking and find hackathon teammates." />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{text.length}/1500</span>
            <Button disabled={text.trim().length < 10 || m.isPending} onClick={() => m.mutate(text)}>
              {m.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Get recommendations
            </Button>
          </div>
          {m.error ? <p className="text-sm text-destructive">{m.error.message}</p> : null}
        </CardContent>
      </Card>

      {m.data ? (
        <div className="space-y-8">
          <p className="text-sm text-foreground">{m.data.summary}</p>
          <section>
            <SectionTitle>Clubs for you</SectionTitle>
            {m.data.clubs.length === 0 ? <p className="text-sm text-muted-foreground">No matching clubs right now.</p> : (
              <div className="grid gap-4 sm:grid-cols-2">
                {m.data.clubs.map((c) => (
                  <Card key={c.id}><CardContent>
                    <Link to="/clubs/$id" params={{ id: c.id }} className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"><Users className="size-4" />{c.name}</Link>
                    <p className="mt-2 text-sm text-muted-foreground">{c.reason}</p>
                  </CardContent></Card>
                ))}
              </div>
            )}
          </section>
          <section>
            <SectionTitle>Upcoming events for you</SectionTitle>
            {m.data.events.length === 0 ? <p className="text-sm text-muted-foreground">No matching upcoming events right now.</p> : (
              <div className="grid gap-4 sm:grid-cols-2">
                {m.data.events.map((e) => (
                  <Card key={e.id}><CardContent>
                    <Link to="/events/$id" params={{ id: e.id }} className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"><CalendarDays className="size-4" />{e.title}</Link>
                    <p className="text-xs text-muted-foreground">{formatEventDate(e.date)}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{e.reason}</p>
                  </CardContent></Card>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </PageShell>
  );
}
