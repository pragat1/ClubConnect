import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Crown, Info, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageShell } from "@/components/PageShell";
import { useProfile } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/premium")({
  head: () => ({
    meta: [
      { title: "Club Connect Premium" },
      { name: "description", content: "Compare Free and Premium student plans." },
      { property: "og:title", content: "Club Connect Premium" },
      { property: "og:description", content: "Compare Free and Premium student plans." },
    ],
  }),
  component: PremiumPage,
});

const rows: [string, boolean, boolean][] = [
  ["Browse, search and filter clubs & events", true, true],
  ["Join clubs and register for events", true, true],
  ["Basic profile, calendar and notifications", true, true],
  ["Basic recommendations", true, true],
  ["Advanced personalized recommendations", false, true],
  ["Participation analytics", false, true],
  ["Advanced skill / achievement profile", false, true],
  ["Priority event registration", false, true],
  ["Advanced calendar features", false, true],
  ["Cross-club networking", false, true],
  ["Exportable activity profile", false, true],
];

function PremiumPage() {
  const { data: profile } = useProfile();
  const [open, setOpen] = useState(false);

  return (
    <PageShell title="Club Connect Premium" description="Free covers everything you need to participate. Premium adds deeper insights and priority features.">
      {profile?.is_premium ? (
        <Card className="mb-6 border-primary/40 bg-primary-soft/40">
          <CardContent className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
            <Crown className="size-4 text-primary" /> Your account has Premium access.
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Free vs Premium</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 font-medium">Feature</th>
                <th className="py-2 text-center font-medium">Free</th>
                <th className="py-2 text-center font-medium">Premium</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, free, prem]) => (
                <tr key={label} className="border-b border-border last:border-0">
                  <td className="py-3 text-foreground">{label}</td>
                  <td className="py-3 text-center">{free ? <Check className="mx-auto size-4 text-primary" aria-label="Included" /> : <Minus className="mx-auto size-4 text-muted-foreground" aria-label="Not included" />}</td>
                  <td className="py-3 text-center">{prem ? <Check className="mx-auto size-4 text-primary" aria-label="Included" /> : <Minus className="mx-auto size-4" aria-label="Not included" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!profile?.is_premium ? (
            <div className="mt-6 flex items-center gap-3">
              <Button onClick={() => setOpen(true)}><Crown className="size-4" /> Upgrade</Button>
              <Badge variant="outline">Payments not yet available</Badge>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="inline-flex items-center gap-2"><Info className="size-4" /> Payments aren't set up yet</DialogTitle>
            <DialogDescription>
              Online payment for Premium has not been configured on Club Connect yet, so no charge will be made and your plan remains Free. Premium access can currently be granted by your college administrator.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
