import { Link } from "react-router-dom";

export function RegisterPage() {
  return (
    <main className="auth-layout">
      <form className="auth-panel">
        <h1>Register</h1>
        <label>
          Display name
          <input type="text" autoComplete="name" />
        </label>
        <label>
          Email
          <input type="email" autoComplete="email" />
        </label>
        <label>
          Password
          <input type="password" autoComplete="new-password" />
        </label>
        <button type="submit">Create account</button>
        <Link to="/login">Already have an account?</Link>
      </form>
    </main>
  );
}
