import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AiRecommendation = {
  summary: string;
  clubs: { id: string; name: string; reason: string }[];
  events: { id: string; title: string; date: string; reason: string }[];
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "clubs", "events"],
  properties: {
    summary: { type: "string" },
    clubs: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "reason"], properties: { id: { type: "string" }, reason: { type: "string" } } } },
    events: { type: "array", items: { type: "object", additionalProperties: false, required: ["id", "reason"], properties: { id: { type: "string" }, reason: { type: "string" } } } },
  },
};

export const recommendFromText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ text: z.string().trim().min(10).max(1500) }).parse(d))
  .handler(async ({ data, context }): Promise<AiRecommendation> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured.");
    const sb = context.supabase;

    const { data: profile } = await sb.from("profiles").select("email").eq("id", context.userId).maybeSingle();
    if (!profile?.email?.toLowerCase().endsWith("@gndec.ac.in")) throw new Error("This feature is for GNDEC students only.");

    const today = new Date().toISOString().slice(0, 10);
    const [{ data: clubs }, { data: events }] = await Promise.all([
      sb.from("clubs").select("id, name, category, description").limit(150),
      sb.from("events").select("id, title, event_type, event_date, description, clubs(name)").gte("event_date", today).order("event_date").limit(100),
    ]);
    if (!clubs?.length && !events?.length) return { summary: "There are no clubs or upcoming events on Club Connect yet.", clubs: [], events: [] };

    const catalog = {
      clubs: (clubs ?? []).map((c) => ({ id: c.id, name: c.name, category: c.category, about: c.description.slice(0, 200) })),
      events: (events ?? []).map((e) => ({ id: e.id, title: e.title, type: e.event_type, date: e.event_date, club: e.clubs?.name, about: (e.description ?? "").slice(0, 200) })),
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, Authorization: `Bearer ${apiKey}`, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions:
          "You recommend college clubs and events to a GNDEC student. Use ONLY ids from the catalog. Pick up to 5 clubs and 5 events that genuinely match. Each reason: one or two friendly sentences tied to what the student wrote. Summary: two sentences. If nothing fits, return empty lists and say so.",
        input: [{ role: "user", content: `Student says:\n${data.text}\n\nCatalog:\n${JSON.stringify(catalog)}` }],
        text: { format: { type: "json_schema", name: "recommendations", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) {
      const body = await res.text().catch(() => "");
      console.error("AI gateway error", res.status, body);
      if (res.status === 429) throw new Error("Too many requests right now. Please try again in a minute.");
      if (res.status === 402 || res.status === 403) throw new Error("AI recommendations are unavailable right now (AI usage limit reached).");
      throw new Error("Could not get recommendations. Please try again.");
    }

    // Consume the SSE stream and collect output text.
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "", out = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === "response.output_text.delta") out += ev.delta;
          if (ev.type === "error" || ev.type === "response.failed") throw new Error("AI request failed.");
        } catch (e) { if (e instanceof Error && e.message === "AI request failed.") throw e; }
      }
    }

    let parsed: { summary: string; clubs: { id: string; reason: string }[]; events: { id: string; reason: string }[] };
    try { parsed = JSON.parse(out); } catch { throw new Error("The AI returned an unexpected answer. Please try again."); }
    const clubMap = new Map((clubs ?? []).map((c) => [c.id, c]));
    const eventMap = new Map((events ?? []).map((e) => [e.id, e]));
    return {
      summary: parsed.summary,
      clubs: parsed.clubs.filter((c) => clubMap.has(c.id)).map((c) => ({ id: c.id, name: clubMap.get(c.id)!.name, reason: c.reason })),
      events: parsed.events.filter((e) => eventMap.has(e.id)).map((e) => ({ id: e.id, title: eventMap.get(e.id)!.title, date: eventMap.get(e.id)!.event_date, reason: e.reason })),
    };
  });
