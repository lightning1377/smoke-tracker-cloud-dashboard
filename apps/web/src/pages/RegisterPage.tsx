import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { formValue } from "../lib/forms";

export function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="auth-layout">
      <form
        className="auth-panel"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          const form = new FormData(event.currentTarget);
          void auth
            .register({
              displayName: formValue(form, "displayName"),
              email: formValue(form, "email"),
              password: formValue(form, "password"),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            })
            .then(() => navigate("/home"))
            .catch((caught: Error) => setError(caught.message));
        }}
      >
        <div>
          <p className="eyebrow">Cloud dashboard</p>
          <h1>Register</h1>
        </div>
        <label>
          Display name
          <input name="displayName" type="text" autoComplete="name" required />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="new-password" minLength={12} required />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button type="submit">Create account</button>
        <Link to="/login">Already have an account?</Link>
      </form>
    </main>
  );
}
