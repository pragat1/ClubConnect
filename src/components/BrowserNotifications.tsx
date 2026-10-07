import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const KEY = "cc-browser-notifications";
const PUSH_TYPES = ["event_reminder", "new_event", "announcement"];

/** Listens for new notifications and shows a browser alert when the student opted in. */
export function BrowserNotificationListener() {
  const { user } = useAuth();
  const qc = useQueryClient();
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
        const n = payload.new as { title: string; message: string; type: string; link: string | null };
        if (localStorage.getItem(KEY) !== "on" || !("Notification" in window) || Notification.permission !== "granted") return;
        if (!PUSH_TYPES.includes(n.type)) return;
        const note = new Notification(n.title, { body: n.message, icon: "/favicon.ico", tag: n.link ?? "club-connect" });
        note.onclick = () => { window.focus(); if (n.link) window.location.href = n.link; };
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, qc]);
  return null;
}

export function BrowserNotificationToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(localStorage.getItem(KEY) === "on" && "Notification" in window && Notification.permission === "granted");
  }, []);

  async function enable() {
    if (!("Notification" in window)) { toast.error("This browser doesn't support notifications."); return; }
    if (window.top !== window.self) { toast.error("Open the app in its own browser tab to allow notifications."); return; }
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm !== "granted") { toast.error("Notifications are blocked. Allow them in your browser's site settings."); return; }
    localStorage.setItem(KEY, "on");
    setOn(true);
    new Notification("Club Connect", { body: "You'll get alerts for event reminders and updates from your clubs." });
  }
  function disable() { localStorage.setItem(KEY, "off"); setOn(false); toast.success("Browser notifications turned off"); }

  return on ? (
    <Button variant="outline" size="sm" onClick={disable}><BellOff className="size-4" /> Turn off browser alerts</Button>
  ) : (
    <Button size="sm" onClick={enable}><Bell className="size-4" /> Enable browser alerts</Button>
  );
}
