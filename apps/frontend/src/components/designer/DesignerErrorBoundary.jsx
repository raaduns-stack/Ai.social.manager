/**
 * DesignerErrorBoundary.jsx
 * Isolates render crashes inside /designer/* so one broken page never
 * whitescreens the whole portal. Scoped to the designer premium theme.
 */
import { Component } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export default class DesignerErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Visible in devtools; never leaks internals to the UI.
    console.error("[designer] render error:", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="rounded-2xl border border-border bg-white p-12 text-center space-y-3">
        <span className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-danger">
          <AlertTriangle size={20} />
        </span>
        <p className="text-lg font-semibold text-ink">Something went wrong</p>
        <p className="text-sm text-ink-muted max-w-md mx-auto">
          This section hit an unexpected error. Your work is safe — try again or head back to the dashboard.
        </p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            onClick={this.handleRetry}
            className="h-9 px-4 rounded-lg bg-primary hover:bg-primary-700 text-white text-sm font-medium transition-colors"
          >
            Try again
          </button>
          <Link
            to="/designer"
            className="h-9 px-4 rounded-lg border border-border text-sm font-medium text-ink hover:bg-canvas transition-colors inline-flex items-center"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }
}
