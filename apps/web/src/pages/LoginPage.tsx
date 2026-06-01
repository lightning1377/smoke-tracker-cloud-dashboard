import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { formValue } from "../lib/forms";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
            .login({
              email: formValue(form, "email"),
              password: formValue(form, "password"),
            })
            .then(() => navigate((location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/home"))
            .catch((caught: Error) => setError(caught.message));
        }}
      >
        <div>
          <p className="eyebrow">Cloud dashboard</p>
          <h1>Log in</h1>
        </div>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" defaultValue="demo@smoketracker.local" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" defaultValue="Password123!" required />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button type="submit">Log in</button>
        <Link to="/register">Create an account</Link>
      </form>
    </main>
  );
}
