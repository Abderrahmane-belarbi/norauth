import { ArrowRight, CheckCircle2, Mail, ShieldCheck, X } from "lucide-react";
import Footer from "./footer";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

export function VerifyEmail() {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [search] = useSearchParams();
  const token = search.get("token");
  return (
    <section className="form-panel">
      <div className="form-inner">
        <div className="form-heading">
          <h1>Verify your email</h1>
          <p className="subtitle">One quick step to secure your account.</p>
        </div>
        {notice && (
          <div className="feedback success" role="status">
            <CheckCircle2 size={18} />
            <div>
              {notice}
              <Link className="feedback-link" to="/login">
                Continue to sign in <ArrowRight size={14} />
              </Link>
              {verified && (
                <Link className="feedback-link" to="/login">
                  Continue to sign in <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        )}
        {error && (
          <div className="feedback error" role="alert">
            <X size={17} />
            <div>
              {error}

              <button
                className="feedback-link"
                onClick={() =>
                  setNotice("A fresh verification link has been sent.")
                }
              >
                Resend verification email
              </button>
            </div>
          </div>
        )}

        <div className="auth-form">
          <div className="token-note">
            <span className="token-note-icon">
              <Mail size={18} />
            </span>
            <span>
              {token
                ? "A verification link is ready to be checked."
                : "Open this page from the verification email you received."}
            </span>
          </div>
          <button
            className="primary-button"
            onClick={() => {
              if (!token)
                setError("We couldn’t find a verification token in this link.");
              else {
                setError("");
                setVerified(true);
                setNotice(
                  "Your email address is now verified. You can sign in to your account.",
                );
              }
            }}
          >
            Verify email <ArrowRight size={17} />
          </button>
          <button
            className="back-link button-link"
            onClick={() =>
              setNotice("A fresh verification link has been sent.")
            }
          >
            Resend verification email
          </button>
        </div>

        <div className="trust-note">
          <ShieldCheck size={15} />
          <span>Your information is protected with end-to-end security.</span>
        </div>
      </div>
      <Footer />
    </section>
  );
}
