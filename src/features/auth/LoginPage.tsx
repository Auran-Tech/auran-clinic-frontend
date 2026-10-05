import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api/client";
import type { BaseResponse } from "../../lib/api/contracts";
import { authSession, type AuthResponse } from "./authSession";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await api.post<BaseResponse<AuthResponse>>("/auth/login", { email, password });
      if (!response.data.status || !response.data.data) throw new Error(response.data.message || "Login failed.");
      authSession.set(response.data.data);
      navigate("/patients", { replace: true });
    } catch {
      setError("Unable to sign in. Check your credentials and API connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand-mark">A</div>
        <div><h1>Welcome back</h1><p>Secure clinic access</p></div>
        <label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" required /></label>
        <label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" required /></label>
        {error && <div className="error-box">{error}</div>}
        <button className="primary-button" disabled={busy}>{busy ? "Signing in..." : "Enter clinic"}</button>
      </form>
    </main>
  );
}
