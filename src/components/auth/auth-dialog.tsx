import * as React from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

type Mode = "login" | "signup";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function friendlyAuthError(error: unknown): string {
  const value = (error ?? {}) as { message?: string; code?: string };
  const code = value.code ?? "";
  const message = (value.message ?? "").toLowerCase();

  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return "Email or password is incorrect. Check your details and try again.";
  }
  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "Please confirm your email before logging in. Check your inbox.";
  }
  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    message.includes("already registered") ||
    message.includes("already been registered")
  ) {
    return "An account with this email already exists. Try logging in or use Forgot password.";
  }
  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    message.includes("too many") ||
    message.includes("rate limit")
  ) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (code === "weak_password" || message.includes("password should be at least")) {
    return "Choose a stronger password with at least 8 characters.";
  }
  if (
    message.includes("failed to fetch") ||
    message.includes("fetch failed") ||
    message.includes("networkerror") ||
    message.includes("network request failed")
  ) {
    return "Couldn't reach the authentication server. Check your connection and try again.";
  }
  if (message.includes("invalid api key") || message.includes("no api key found")) {
    return "Sign in is not configured correctly. Check the Supabase URL and anon key.";
  }

  return value.message || "Something went wrong. Please try again.";
}

function validateForm(
  mode: Mode,
  email: string,
  password: string,
  confirmPassword: string,
): string | null {
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  if (mode === "signup") {
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
  } else if (!password) {
    return "Enter your password.";
  }
  return null;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.82-.07-1.6-.2-2.36H12v4.47h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.73Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.3a7.2 7.2 0 0 1 0-4.6v-3.1H1.29a12 12 0 0 0 0 10.8l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.29 6.6l4 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}

export function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = React.useState<Mode>("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [formNotice, setFormNotice] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [resetLoading, setResetLoading] = React.useState(false);

  const configured = isSupabaseConfigured;

  React.useEffect(() => {
    if (open) return;
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormError(null);
    setFormNotice(null);
    setSubmitting(false);
    setGoogleLoading(false);
    setResetLoading(false);
  }, [open]);

  React.useEffect(() => {
    setFormError(null);
    setFormNotice(null);
    setPassword("");
    setConfirmPassword("");
  }, [mode]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const client = supabase;
    if (!client) return;

    const emailValue = email.trim();
    const validationError = validateForm(mode, emailValue, password, confirmPassword);
    if (validationError) {
      setFormNotice(null);
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormNotice(null);

    try {
      if (mode === "signup") {
        const { data, error } = await client.auth.signUp({
          email: emailValue,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;

        if (data.user?.identities && data.user.identities.length === 0) {
          setFormError(
            "An account with this email already exists. Try logging in or use Forgot password.",
          );
          return;
        }

        setPassword("");
        setConfirmPassword("");
        setFormNotice(
          data.session
            ? "Account created. You are now logged in."
            : "Check your inbox to confirm your email, then log in.",
        );
      } else {
        const { error } = await client.auth.signInWithPassword({
          email: emailValue,
          password,
        });
        if (error) throw error;
        setPassword("");
      }
    } catch (error) {
      setFormError(friendlyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    const client = supabase;
    if (!client) return;

    setGoogleLoading(true);
    setFormError(null);
    setFormNotice(null);

    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (error) {
      setFormError(friendlyAuthError(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const client = supabase;
    if (!client) return;

    const emailValue = email.trim();
    if (!EMAIL_PATTERN.test(emailValue)) {
      setFormNotice(null);
      setFormError("Enter a valid email address first, then choose Forgot password.");
      return;
    }

    setResetLoading(true);
    setFormError(null);
    setFormNotice(null);

    try {
      const { error } = await client.auth.resetPasswordForEmail(emailValue, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setFormNotice(
        "If an account exists for that email, a password reset link is on its way. Check your inbox.",
      );
    } catch (error) {
      setFormError(friendlyAuthError(error));
    } finally {
      setResetLoading(false);
    }
  };

  const disableForm = !configured || submitting;
  const submitLabel =
    mode === "login"
      ? submitting
        ? "Logging in…"
        : "Log in"
      : submitting
        ? "Creating account…"
        : "Create account";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log in to FlowSync</DialogTitle>
          <DialogDescription>
            Use your email and password, or continue with Google.
          </DialogDescription>
        </DialogHeader>

        {!configured && (
          <div
            role="status"
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800"
          >
            <span className="font-semibold">Sign in is not configured yet.</span>{" "}
            Add <code className="font-mono">VITE_SUPABASE_URL</code> and{" "}
            <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> to{" "}
            <code className="font-mono">.env</code>, then restart the dev server.
            The form is disabled until then.
          </div>
        )}

        <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Log in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
        </Tabs>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={!configured}
              aria-invalid={Boolean(formError)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="auth-password">Password</Label>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={!configured || resetLoading}
                  className="text-xs font-medium text-primary underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-50"
                >
                  {resetLoading ? "Sending…" : "Forgot password?"}
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={!configured}
                aria-invalid={Boolean(formError)}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {mode === "signup" && (
              <p className="text-xs text-muted-foreground">At least 8 characters.</p>
            )}
          </div>

          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="auth-confirm-password">Confirm password</Label>
              <div className="relative">
                <Input
                  id="auth-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  disabled={!configured}
                  aria-invalid={Boolean(formError)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {formError && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive"
            >
              {formError}
            </p>
          )}

          {formNotice && (
            <p
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-700"
            >
              {formNotice}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={disableForm}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitLabel}
          </Button>
        </form>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
          disabled={!configured || googleLoading}
        >
          {googleLoading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </Button>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Signing in does not change what FlowSync captures yet. Your extensions and
          the backend still use the local API key.
        </p>
      </DialogContent>
    </Dialog>
  );
}
