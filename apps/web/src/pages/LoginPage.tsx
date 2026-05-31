import { Link } from "react-router-dom";

export function LoginPage() {
  return (
    <main className="auth-layout">
      <form className="auth-panel">
        <h1>Log in</h1>
        <label>
          Email
          <input type="email" autoComplete="email" />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" />
        </label>
        <button type="submit">Log in</button>
        <Link to="/register">Create an account</Link>
      </form>
    </main>
  );
}
