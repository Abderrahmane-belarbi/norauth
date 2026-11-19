import { useState, type FormEvent } from "react";
import Field from "./field";
import Footer from "./footer";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (email.toLowerCase().includes("unknown")) {
      setError("Invalid email. We couldn’t find an account with that address.");
      return;
    }
    try {
      setBusy(true);
      const res = await fetch("http://localhost:5000/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      console.log("DATA:", data);
      console.log("Body:", data.body);
      if (!res.ok) {
        return;
      }
    } catch (error) {
      console.log(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="form-panel">
      <div className="form-inner">
        <div className="form-heading">
          <h1>Forgot your password?</h1>
          <p className="subtitle">
            Enter your email to request a password reset link.
          </p>
        </div>
        {error && (
          <div className="feedback error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="feedback success" role="status">
            {notice}
          </div>
        )}
        <form onSubmit={submit} className="auth-form">
          <Field
            label="Email address"
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <button className="primary-button" disabled={busy}>
            {busy ? "Sending link…" : "Send reset link"}{" "}
            <ArrowRight size={17} />
          </button>
          <Link className="back-link" to="/login">
            <ArrowLeft size={15} /> Back to sign in
          </Link>
        </form>
      </div>
      <Footer />
    </section>
  );
}
