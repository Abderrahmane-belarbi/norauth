import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Inbox,
  LoaderCircle,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import Field from "./field";
import Footer from "./footer";
import "./verify-email.css";

export function VerifyEmail() {
  const location = useLocation();
  const [search] = useSearchParams();
  const token = search.get("token")?.trim() ?? "";
  const passedEmail: unknown = location.state?.email;
  const initialEmail =
    typeof passedEmail === "string" ? passedEmail : (search.get("email") ?? "");
  const [email, setEmail] = useState(initialEmail);
  const [delivery, setDelivery] = useState<"idle" | "sending" | "sent">("idle");
  const [lastSentEmail, setLastSentEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);
  const isVerifying = Boolean(token) && verifiedToken !== token;
  const verified = Boolean(token) && verifiedToken === token;
  const isCoolingDown = cooldown > 0;

  // UI preview only: these timers demonstrate states without making API calls.
  // A real verification response must determine success when connected later.
  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => setVerifiedToken(token), 1600);
    return () => window.clearTimeout(timer);
  }, [token]);

  useEffect(() => {
    if (delivery !== "sending") return;
    const timer = window.setTimeout(() => {
      setDelivery("sent");
      setCooldown(60);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [delivery]);

  useEffect(() => {
    if (!isCoolingDown) return;
    const timer = window.setInterval(() => {
      setCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isCoolingDown]);

  function resendEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || delivery === "sending" || isCoolingDown) return;
    setLastSentEmail(email.trim());
    setDelivery("sending");
  }

  return (
    <section className="form-panel verify-email-panel">
      <div className="form-top">
        <span>Already verified?</span>
        <Link to="/login">
          Sign in <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      <div className="form-inner">
        <div className="form-heading">
          <span className="verification-eyebrow">
            {verified ? "All set" : "One last step"}
          </span>
          <h1>
            {verified
              ? "You're all verified."
              : isVerifying
                ? "Verifying your email"
                : "Verify your email"}
          </h1>
          <p className="subtitle">
            {verified
              ? "Your email is confirmed. You're ready to sign in."
              : isVerifying
                ? "Just a moment while we check your verification link."
                : "A quick check, and you're ready to get started."}
          </p>
        </div>

        {token ? (
          <div className="auth-form">
            <div
              className="verification-status-card"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {verified ? (
                <CheckCircle2 size={20} aria-hidden="true" />
              ) : (
                <LoaderCircle
                  size={20}
                  className="verification-spinner"
                  aria-hidden="true"
                />
              )}
              <div>
                <strong>
                  {verified
                    ? "Email verified successfully"
                    : "Checking your link…"}
                </strong>
                <p>
                  {verified
                    ? "Thanks for confirming your email address."
                    : "This should only take a few seconds."}
                </p>
              </div>
            </div>
            {verified ? (
              <Link className="primary-button" to="/login">
                Continue to sign in
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            ) : (
              <button className="primary-button" type="button" disabled>
                Verifying your email…
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="verification-inbox-card">
              <span className="token-note-icon" aria-hidden="true">
                <Inbox size={21} strokeWidth={1.5} />
              </span>
              <div>
                <strong>Check your inbox</strong>
                <p>
                  {initialEmail
                    ? "Click the link we emailed you to verify your address."
                    : "Enter your registered email to get a verification link."}
                </p>
              </div>
            </div>

            <form className="auth-form" onSubmit={resendEmail}>
              <div>
                <Field
                  label="Email address"
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(value) => {
                    setEmail(value);
                    if (delivery === "sent") setDelivery("idle");
                  }}
                  autoComplete="email"
                />
                <div className="verification-resend-row">
                  <span>Didn't receive an email?</span>
                  <button
                    className="verification-resend-button"
                    type="submit"
                    disabled={
                      !email.trim() || delivery === "sending" || isCoolingDown
                    }
                  >
                    {delivery === "sending" ? (
                      <LoaderCircle
                        size={12}
                        className="verification-spinner"
                        aria-hidden="true"
                      />
                    ) : (
                      <RefreshCw size={11} aria-hidden="true" />
                    )}
                    {delivery === "sending"
                      ? "Sending…"
                      : isCoolingDown
                        ? `Resend in ${cooldown}s`
                        : "Resend email"}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
      <Footer />
    </section>
  );
}
