import { ArrowRight, CheckCircle2, ShieldCheck, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "../brand";
import { useState, type FormEvent } from "react";
import Field from "./field";
import Footer from "./footer";

export function Register() {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (password !== confirm) {
      setError("Your passwords don’t match. Please try again.");
      return;
    }
    try {
      setBusy(true);
      const response = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message);
      } else {
        setNotice(data.message);
        //setNotice("Check your email. We’ve sent a verification link to your inbox.");
      }
    } catch (error) {
      console.log('Error Register:', error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="form-panel">
      <div className="form-top">
        <span>Already have an account?</span>
        <Link to={"/login"}>
          Sign in
          <ArrowRight size={15} />
        </Link>
      </div>
      <div className="form-inner">
        <Link to="/login" className="mobile-brand">
          <Brand />
        </Link>
        <div className="form-heading">
          <h1>Create your account</h1>
          <p className="subtitle">A better way to keep everything in focus.</p>
        </div>
        {notice && (
          <div className="feedback success" role="status">
            <CheckCircle2 size={18} />
            <div>
              {notice}
              <div className="feedback-actions">
                <button
                  onClick={() =>
                    setNotice("A fresh verification link is on its way.")
                  }
                >
                  Resend verification email
                </button>
                <Link to="/login">Go to login</Link>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="feedback error" role="alert">
            <X size={17} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={submit} className="auth-form">
          <Field
            label="Full name"
            id="name"
            placeholder="Alex Morgan"
            value={name}
            onChange={setName}
            autoComplete="name"
          />
          <Field
            label="Email address"
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <Field
            label="Password"
            id="password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          <Field
            label="Confirm password"
            id="confirm"
            type="password"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
          />
          <button className="primary-button" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}{" "}
            <ArrowRight size={17} />
          </button>
        </form>

        <div className="trust-note">
          <ShieldCheck size={15} />
          <span>Your information is protected with end-to-end security.</span>
        </div>
      </div>
      <Footer />
    </section>
  );
}
