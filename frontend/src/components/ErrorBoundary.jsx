import React, { Component } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetErrorBoundary: this.handleReset,
        });
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center"
          data-testid="error-boundary-fallback"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 grid place-items-center mb-4 border border-rose-500/20 shadow-soft">
            <AlertTriangle size={28} />
          </div>
          <h2 className="font-serif text-xl font-bold text-primary mb-1">
            {this.props.title || "Terjadi Kesalahan Memuat Halaman"}
          </h2>
          <p className="text-xs text-subtle max-w-sm mb-6">
            {this.state.error?.message || "Sistem mengalami kendala saat merender komponen ini. Silakan coba muat ulang."}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-lifted hover:bg-[#122820] active:scale-95 transition-all"
            >
              <RefreshCw size={14} />
              <span>Coba Lagi</span>
            </button>
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-line text-ink text-xs font-bold hover:bg-muted active:scale-95 transition-all"
            >
              <Home size={14} />
              <span>Beranda</span>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function RouteErrorBoundary({ children, title }) {
  return <ErrorBoundary title={title}>{children}</ErrorBoundary>;
}
