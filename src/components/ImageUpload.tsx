import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export function ImageUpload({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file.");
    if (file.size > MAX_BYTES) return toast.error("Image must be 5 MB or smaller.");
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Please sign in again.");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${u.user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("club-media").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: signed, error: sErr } = await supabase.storage.from("club-media").createSignedUrl(path, TEN_YEARS);
      if (sErr || !signed) throw sErr ?? new Error("Could not create image link.");
      onChange(signed.signedUrl);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative size-16 overflow-hidden rounded-md border border-border">
            <img src={value} alt="" className="size-full object-cover" />
            <button type="button" aria-label="Remove image" onClick={() => onChange("")} className="absolute right-0.5 top-0.5 rounded-full bg-background/90 p-0.5 text-foreground">
              <X className="size-3" />
            </button>
          </div>
        ) : null}
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {value ? "Replace" : "Upload image"}
        </Button>
        <input id={id} ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
      </div>
    </div>
  );
}
