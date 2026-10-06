import { Link } from "react-router-dom";
import { useI18n } from "../lib/i18n/i18n";

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <main className="not-found-page">
      <section className="card not-found-card">
        <span className="eyebrow">404</span>
        <h1>{t("Page not found", "الصفحة غير موجودة")}</h1>
        <p>{t("The requested page does not exist or is no longer available.", "الصفحة المطلوبة غير موجودة أو لم تعد متاحة.")}</p>
        <Link className="primary-button" to="/dashboard">{t("Back to dashboard", "العودة إلى لوحة التحكم")}</Link>
      </section>
    </main>
  );
}
