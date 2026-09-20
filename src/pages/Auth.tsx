import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps { redirectAfterAuth?: string; }
function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  return returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : fallback;
}
function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"), redirectAfterAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate(redirect);
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn();
      navigate(redirect);
    } catch (err) {
      console.error("Local sign-in error:", err);
      setError(`Unable to start a local session: ${err instanceof Error ? err.message : "Please try again."}`);
      setIsLoading(false);
    }
  };

  return <div className="flex min-h-screen flex-col"><header className="mx-auto w-full max-w-5xl px-4 py-5"><Link to="/" className="inline-flex items-center gap-2.5"><div className="clay-sm flex h-11 w-11 items-center justify-center bg-[var(--clay-4)] text-xl text-white">⚛</div><div><p className="text-base font-extrabold leading-tight">Apex Physics</p><p className="text-[11px] font-semibold text-muted-foreground">Don't memorize. Understand.</p></div></Link></header><div className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 md:pt-14"><div className="clay w-full max-w-md p-8"><h1 className="text-2xl font-black tracking-tight">Let's get started</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Start a private local learning session. Your progress and lab notebook stay on this device; no email service or external API key is required.</p><Button type="button" onClick={handleGuestLogin} disabled={isLoading} className="clay-btn clay-press mt-6 w-full py-3.5 font-extrabold">{isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <UserX className="mr-2 size-4" />}{isLoading ? "Starting local session…" : "Continue locally"}<ArrowRight className="ml-auto size-4" /></Button>{error && <p className="mt-3 text-sm font-semibold text-destructive">{error}</p>}<p className="mt-6 text-center text-[11px] leading-5 text-muted-foreground">Physics 1 · Physics 2 · C: Mechanics · C: E&M<br />No email, payment, AI, analytics, or third-party API is needed.</p></div></div></div>;
}
export default function AuthPage(props: AuthProps) { return <Suspense><Auth {...props} /></Suspense>; }
