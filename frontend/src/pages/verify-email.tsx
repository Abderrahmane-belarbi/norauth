import {
  ArrowRight,
  CheckCircle2,
  Inbox,
  LoaderCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import Field from "../components/auth/field";
import Footer from "../components/auth/footer";
import "./verify-email.css";
import { useAuth } from "../store/auth.store";
import { AuthRequestError } from "../lib/auth-api";
import { getCooldownSeconds, getRemainingSeconds, normalizeCooldownEmail, readCooldownDeadline, saveCooldownDeadline } from "../lib/utils/auth.utils";

const cooldownKeyPrefix =
  import.meta.env.VITE_EMAIL_VERIFICATION_RESEND_AVAILABLE_AT_KEY ||
  "emailVerificationResendAvailableAt";
const defaultCooldown = getCooldownSeconds(
  import.meta.env.VITE_EMAIL_VERIFICATION_COOLDOWN,
);

type VerificationResult = {
  token: string;
  status: "success" | "error";
  message: string;
};

export function VerifyEmail() {
  const verifyEmail = useAuth((state) => state.verifyEmail);
  const resendVerificationEmail = useAuth((state) => state.resendVerificationEmail);
  const location = useLocation();
  const [search] = useSearchParams();
  const token = search.get("token")?.trim() ?? "";
  const passedEmail: unknown = location.state?.email;
  const initialEmail =
    typeof passedEmail === "string" ? passedEmail : (search.get("email") ?? "");
  const [email, setEmail] = useState(initialEmail);
  const [delivery, setDelivery] = useState<"idle" | "sending" | "sent">("idle");
  const [sentEmail, setSentEmail] = useState("");
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [showInboxMessage, setShowInboxMessage] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [deadlines, setDeadlines] = useState<Record<string, number>>({});
  const [now, setNow] = useState(() => Date.now());
  const sending = useRef(false);
  const normalizedEmail = normalizeCooldownEmail(email);
  const savedDeadline = useMemo(
    () => readCooldownDeadline(normalizedEmail, cooldownKeyPrefix),
    [normalizedEmail],
  );
  const deadline = deadlines[normalizedEmail] ?? savedDeadline;
  const cooldown = getRemainingSeconds(deadline, now);
  const isCoolingDown = cooldown > 0;
  const isSending = delivery === "sending";
  const isVerifying = Boolean(token) && verification?.token !== token;
  const verified =
    Boolean(token) && verification?.token === token && verification.status === "success";
  const verificationError =
    verification?.token === token && verification.status === "error"
      ? verification.message
      : "";

  useEffect(() => {
    if (!token) return;
    let active = true;
    // The store shares in-flight requests, including Strict Mode's second setup.
    void verifyEmail(token).then(
      (message) => {
        if (active) setVerification({ token, status: "success", message });
      },
      (requestError: unknown) => {
        if (active) {
          setVerification({
            token,
            status: "error",
            message:
              requestError instanceof Error
                ? requestError.message
                : "Could not verify your email. Please try again.",
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [token, verifyEmail]);

  useEffect(() => {
    if (!isCoolingDown) return;
    const updateNow = () => setNow(Date.now());
    const timer = window.setInterval(updateNow, 1000);
    window.addEventListener("focus", updateNow);
    document.addEventListener("visibilitychange", updateNow);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", updateNow);
      document.removeEventListener("visibilitychange", updateNow);
    };
  }, [deadline, isCoolingDown]);

  function startCooldown(targetEmail: string, seconds: number) {
    const nextDeadline = saveCooldownDeadline(targetEmail, seconds, cooldownKeyPrefix);
    setDeadlines((current) => ({
      ...current,
      [normalizeCooldownEmail(targetEmail)]: nextDeadline,
    }));
    setNow(Date.now());
  }

  async function resendEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const targetEmail = email.trim();
    if (!targetEmail || sending.current || getRemainingSeconds(deadline) > 0) {
      setNow(Date.now());
      return;
    }
    sending.current = true;
    setDelivery("sending");
    setNotice("");
    setError("");
    try {
      const result = await resendVerificationEmail(targetEmail);
      startCooldown(targetEmail, result.retryAfterSeconds ?? defaultCooldown);
      setSentEmail(targetEmail);
      setNotice(result.message);
      setDelivery("sent");
      setShowInboxMessage(true);
    } catch (requestError) {
      if (
        requestError instanceof AuthRequestError &&
        requestError.retryAfterSeconds !== undefined
      ) {
        startCooldown(targetEmail, requestError.retryAfterSeconds);
      }
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Sending verification email failed. Please try again.",
      );
      setDelivery("idle");
      setShowInboxMessage(false);
    } finally {
      sending.current = false;
    }
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
                : verificationError
                  ? "Request a new verification link to continue."
                  : "A quick check, and you're ready to get started."}
          </p>
        </div>

        {token ? (
          <div className="auth-form">
            <div
              className="verification-status-card"
              role={verificationError ? "alert" : "status"}
              aria-live={verificationError ? "assertive" : "polite"}
              aria-atomic="true"
            >
              {verified ? (
                <CheckCircle2 size={20} aria-hidden="true" />
              ) : verificationError ? (
                <X size={20} aria-hidden="true" />
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
                    : verificationError
                      ? "We couldn't verify your email"
                      : "Checking your link…"}
                </strong>
                <p>
                  {verified
                    ? verification?.message
                    : verificationError || "This should only take a few seconds."}
                </p>
              </div>
            </div>
            {verified ? (
              <Link className="primary-button" to="/login">
                Continue to sign in
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            ) : verificationError ? (
              <Link className="primary-button" to="/verify-email" state={{ email }}>
                Request a new link
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            ) : (
              <button className="primary-button" type="button" disabled>
                Verifying your email…
              </button>
            )}
          </div>
        ) : (
          <form className="auth-form" onSubmit={resendEmail}>
            <div className="verification-form-body">
              {showInboxMessage ? (
                <div className="verification-inbox-card" role="status" aria-live="polite">
                  <span className="token-note-icon" aria-hidden="true">
                    <Inbox size={21} strokeWidth={1.5} />
                  </span>

                  <div className="verification-inbox-copy">
                    <strong>Check your inbox</strong>
                    <p>
                      {notice} Click the link we emailed to {sentEmail} to verify your address.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="button-link verification-dismiss-button text-gray-500 hover:text-gray-900"
                    aria-label="Dismiss inbox message"
                    onClick={() => setShowInboxMessage(false)}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <Field
                  label="Email address"
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(value) => {
                    setEmail(value);
                    setNow(Date.now());
                    setError("");
                    setNotice("");
                    if (delivery === "sent") setDelivery("idle");
                  }}
                  autoComplete="email"
                  disabled={isSending}
                />
              )}
              {error && (
                <p className="text-red-900 text-sm" role="alert">{error}</p>
              )}
              <div className="verification-resend-row">
                <span>Didn't receive an email?</span>
                <button
                  className="verification-resend-button"
                  type="submit"
                  disabled={!email.trim() || isSending || isCoolingDown}
                >
                  {isSending ? (
                    <LoaderCircle
                      size={14}
                      className="verification-spinner"
                      aria-hidden="true"
                    />
                  ) : (
                    <RefreshCw size={14} aria-hidden="true" />
                  )}
                  {isSending
                    ? "Sending…"
                    : isCoolingDown
                      ? `Resend in ${cooldown}s`
                      : "Send email"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
      <Footer />
    </section>
  );
}
