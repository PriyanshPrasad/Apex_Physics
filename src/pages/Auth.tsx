import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, UserX } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface AuthProps {
  redirectAfterAuth?: string;
}

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"), redirectAfterAuth);
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (err) {
      console.error("Email sign-in error:", err);
      setError(err instanceof Error ? err.message : "Failed to send verification code. Please try again.");
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate(redirect);
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("The verification code you entered is incorrect.");
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      navigate(redirect);
    } catch (err) {
      console.error("Guest login error:", err);
      setError(`Failed to sign in as guest: ${err instanceof Error ? err.message : "Unknown error"}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-5xl px-4 py-5">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="clay-sm flex h-11 w-11 items-center justify-center bg-[var(--clay-4)] text-xl text-white">⚛</div>
          <div>
            <p className="text-base font-extrabold leading-tight">AP Physics Mastery</p>
            <p className="text-[11px] font-semibold text-muted-foreground">Don't memorize. Understand.</p>
          </div>
        </Link>
      </header>

      <div className="flex flex-1 items-start justify-center px-4 pb-16 pt-6 md:pt-14">
        <div className="clay w-full max-w-md p-8">
          {step === "signIn" ? (
            <>
              <h1 className="text-2xl font-black tracking-tight">Let's get started</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enter your email to sign in or create an account — or hop in as a guest. Your roadmap is two minutes away.
              </p>
              <form onSubmit={handleEmailSubmit} className="mt-6">
                <label className="text-xs font-bold">
                  <span className="text-muted-foreground">Email</span>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                    <input
                      name="email"
                      type="email"
                      required
                      disabled={isLoading}
                      placeholder="name@example.com"
                      className="clay-inset w-full py-3 pl-10 pr-3 text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </label>
                {error && <p className="mt-2 text-sm font-semibold text-destructive">{error}</p>}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="clay-btn clay-press mt-4 w-full border-0 py-3.5 font-extrabold"
                >
                  {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
                  Continue
                </Button>
              </form>
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs font-bold text-muted-foreground">or</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <Button
                type="button"
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="clay-sm clay-press w-full py-3 font-extrabold"
              >
                <UserX className="mr-2 size-4" /> Continue as guest
              </Button>
              <p className="mt-6 text-center text-[11px] leading-5 text-muted-foreground">
                Physics 1 · Physics 2 · C: Mechanics · C: E&M<br />
                Curriculum aligned to the current College Board frameworks
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-black tracking-tight">Check your email</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                We sent a 6-digit code to <strong className="text-foreground">{step.email}</strong>.
              </p>
              <form onSubmit={handleOtpSubmit} className="mt-6">
                <input type="hidden" name="email" value={step.email} />
                <input type="hidden" name="code" value={otp} />
                <label className="text-xs font-bold">
                  <span className="text-muted-foreground">Verification code</span>
                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    disabled={isLoading}
                    inputMode="numeric"
                    autoFocus
                    placeholder="000000"
                    className="clay-inset mt-1 w-full py-3 text-center text-2xl font-black tracking-[0.5em] outline-none placeholder:text-muted-foreground/50"
                  />
                </label>
                {error && <p className="mt-2 text-sm font-semibold text-destructive">{error}</p>}
                <Button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="clay-btn clay-press mt-4 w-full border-0 py-3.5 font-extrabold"
                >
                  {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <ArrowRight className="mr-2 size-4" />}
                  Verify & enter
                </Button>
              </form>
              <button
                onClick={() => setStep("signIn")}
                disabled={isLoading}
                className="mt-4 w-full text-center text-xs font-bold text-muted-foreground underline hover:text-foreground"
              >
                Use a different email
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
