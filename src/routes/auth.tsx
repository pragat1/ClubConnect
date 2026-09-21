import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ACADEMIC_YEARS, BRANCHES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  college: z.string().optional(),
  mode: z.enum(["signin", "register"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Club Connect" },
      {
        name: "description",
        content: "Sign in or register with your college email to use Club Connect.",
      },
      { property: "og:title", content: "Sign in — Club Connect" },
      { property: "og:description", content: "College-exclusive sign in for Club Connect." },
    ],
  }),
  component: AuthPage,
});

const PENDING_INTERESTS_KEY = "cc_pending_interests";

export async function syncPendingInterests(userId: string, email: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(PENDING_INTERESTS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { email: string; interests: string[] };
    if (parsed.email !== email || parsed.interests.length === 0) return;
    await supabase
      .from("user_interests")
      .upsert(parsed.interests.map((interest_id) => ({ user_id: userId, interest_id })));
    window.localStorage.removeItem(PENDING_INTERESTS_KEY);
  } catch {
    /* ignore */
  }
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  const { data: colleges } = useQuery({
    queryKey: ["colleges"],
    queryFn: async () => {
      const { data, error } = await supabase.from("colleges").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const college = colleges?.find((c) => c.id === search.college) ?? colleges?.[0];

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-12 sm:px-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Welcome to Club Connect</h1>
        {college ? (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {college.name} — use your <strong>@{college.domain}</strong> email address.
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-muted-foreground">
            <Link to="/college" className="text-primary underline">
              Choose your college
            </Link>{" "}
            to continue.
          </p>
        )}
      </div>

      {college ? (
        <Tabs defaultValue={search.mode === "register" ? "register" : "signin"}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <SignInCard domain={college.domain} />
          </TabsContent>
          <TabsContent value="register">
            <RegisterCard domain={college.domain} />
          </TabsContent>
        </Tabs>
      ) : null}
    </main>
  );
}

function friendlyError(message: string) {
  if (/invalid login credentials/i.test(message)) return "Incorrect email or password.";
  if (/email not confirmed/i.test(message))
    return "Please confirm your email address first — check your inbox.";
  if (/already registered/i.test(message)) return "An account with this email already exists.";
  return "Something went wrong. Please try again.";
}

function SignInCard({ domain }: { domain: string }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.toLowerCase().endsWith(`@${domain}`)) {
      setError(`Use your college email ending in @${domain}.`);
      return;
    }
    setBusy(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (signInError) {
      setError(friendlyError(signInError.message));
      return;
    }
    if (data.user) await syncPendingInterests(data.user.id, data.user.email ?? "");
    toast.success("Signed in successfully.");
    navigate({ to: "/dashboard", replace: true });
  }

  async function onForgotPassword() {
    if (!email) {
      setError("Enter your college email first, then select Forgot password.");
      return;
    }
    setResetting(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetting(false);
    if (resetError) {
      toast.error("Could not send the reset email. Please try again.");
      return;
    }
    toast.success("Password reset link sent to your email.");
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Access your dashboard, clubs and event registrations.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="signin-email">College email</Label>
            <Input
              id="signin-email"
              type="email"
              autoComplete="email"
              required
              placeholder={`yourname1234567@${domain}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Sign in
          </Button>
          <button
            type="button"
            onClick={onForgotPassword}
            disabled={resetting}
            className="w-full text-center text-sm text-primary underline underline-offset-4"
          >
            {resetting ? "Sending reset link…" : "Forgot password?"}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}

function RegisterCard({ domain }: { domain: string }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    crn: "",
    email: "",
    password: "",
    confirm: "",
    branch: "",
    year: "",
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const { data: interests } = useQuery({
    queryKey: ["interests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("interests").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.email.toLowerCase().endsWith(`@${domain}`)) {
      setError(`Registration is restricted to @${domain} email addresses.`);
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!form.fullName.trim() || !form.crn.trim() || !form.branch || !form.year) {
      setError("Please complete all required fields.");
      return;
    }

    setBusy(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: form.fullName.trim(),
          crn: form.crn.trim(),
          branch: form.branch,
          academic_year: form.year,
        },
      },
    });
    setBusy(false);

    if (signUpError) {
      setError(friendlyError(signUpError.message));
      return;
    }

    if (typeof window !== "undefined" && selected.length) {
      window.localStorage.setItem(
        "cc_pending_interests",
        JSON.stringify({ email: form.email.trim(), interests: selected }),
      );
    }

    if (data.session && data.user) {
      await syncPendingInterests(data.user.id, data.user.email ?? "");
      toast.success("Account created.");
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Confirm your email</CardTitle>
          <CardDescription>
            We sent a confirmation link to {form.email}. Open it to activate your account, then sign
            in. Your selected interests will be applied automatically.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Register with your college email to join clubs and events.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="reg-name">Full name</Label>
            <Input
              id="reg-name"
              required
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-crn">College ID / CRN</Label>
              <Input
                id="reg-crn"
                required
                value={form.crn}
                onChange={(e) => update("crn", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-year">Academic year</Label>
              <Select value={form.year} onValueChange={(v) => update("year", v)}>
                <SelectTrigger id="reg-year">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {ACADEMIC_YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-branch">Branch / Department</Label>
            <Select value={form.branch} onValueChange={(v) => update("branch", v)}>
              <SelectTrigger id="reg-branch">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {BRANCHES.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-email">College email</Label>
            <Input
              id="reg-email"
              type="email"
              required
              placeholder={`yourname1234567@${domain}`}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                required
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-confirm">Confirm password</Label>
              <Input
                id="reg-confirm"
                type="password"
                autoComplete="new-password"
                required
                value={form.confirm}
                onChange={(e) => update("confirm", e.target.value)}
              />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">Interests</legend>
            <p className="text-xs text-muted-foreground">
              Used to personalize your club and event recommendations.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {(interests ?? []).map((interest) => {
                const active = selected.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setSelected((s) =>
                        active ? s.filter((i) => i !== interest.id) : [...s, interest.id],
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {interest.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {error ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Create account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
