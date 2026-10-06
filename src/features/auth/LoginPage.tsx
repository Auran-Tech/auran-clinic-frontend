import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api/client";
import type { BaseResponse } from "../../lib/api/contracts";
import { useI18n } from "../../lib/i18n/i18n";
import { authSession, type AuthResponse } from "./authSession";

export function LoginPage() {
  const navigate = useNavigate();
  const { t, toggleLocale, locale } = useI18n();
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
      navigate("/dashboard", { replace: true });
    } catch {
      setError(t(
        "Unable to sign in. Check your credentials and API connection.",
        "تعذر تسجيل الدخول. تحقق من بيانات الدخول واتصال الخادم."
      ));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <button type="button" className="auth-language" onClick={toggleLocale}>{locale === "ar" ? "English" : "العربية"}</button>
        <div className="brand-mark">A</div>
        <div><h1>{t("Welcome back", "مرحبًا بعودتك")}</h1><p>{t("Secure clinic access", "دخول آمن لنظام العيادة")}</p></div>
        <label>{t("Email", "البريد الإلكتروني")}<input value={email} onChange={e => setEmail(e.target.value)} type="email" required /></label>
        <label>{t("Password", "كلمة المرور")}<input value={password} onChange={e => setPassword(e.target.value)} type="password" required /></label>
        {error && <div className="error-box">{error}</div>}
        <button className="primary-button" disabled={busy}>{busy ? t("Signing in...", "جارٍ تسجيل الدخول...") : t("Enter clinic", "دخول العيادة")}</button>
      </form>
    </main>
  );
}
