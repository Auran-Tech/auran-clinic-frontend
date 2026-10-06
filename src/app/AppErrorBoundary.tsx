import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled application error", error, info);
  }

  private reload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;

    const arabic = document.documentElement.lang === "ar";
    return (
      <main className="fatal-error-page">
        <section className="card fatal-error-card">
          <span className="eyebrow">{arabic ? "خطأ غير متوقع" : "UNEXPECTED ERROR"}</span>
          <h1>{arabic ? "حدث خطأ في التطبيق" : "Something went wrong"}</h1>
          <p>{arabic ? "أعد تحميل الصفحة. إذا استمرت المشكلة، تواصل مع مسؤول النظام." : "Reload the page. If the problem continues, contact your system administrator."}</p>
          <button className="primary-button" onClick={this.reload}>
            {arabic ? "إعادة تحميل الصفحة" : "Reload page"}
          </button>
        </section>
      </main>
    );
  }
}
