/**
 * DesignerLayout.jsx
 * Shell for /designer/* — mirrors AdminLayout/DashboardLayout.
 * Fetches the dashboard summary once and shares it with the navbar +
 * sidebar so shell figures (pending payout, earnings) are live, never mocked.
 */
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import DesignerSidebar from "../components/layout/DesignerSidebar";
import DesignerNavbar from "../components/layout/DesignerNavbar";
import DesignerErrorBoundary from "../components/designer/DesignerErrorBoundary";
import GlobalToast from "../components/ui/GlobalToast";
import { getDesignerDashboard } from "../features/designer/designer-api";
import "../styles/designer-premium.css";

export default function DesignerLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [summary, setSummary] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    getDesignerDashboard()
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch(() => {
        // Silent — shell figures hide; page-level errors live on each page.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="designer-premium flex h-screen w-full overflow-hidden bg-canvas text-ink font-sans">
      <DesignerSidebar summary={summary} className="hidden md:flex h-screen shrink-0 border-r border-border bg-white" />

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <DesignerSidebar
            summary={summary}
            className="relative flex w-64 flex-col bg-white h-full shadow-2xl z-10"
            onClose={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DesignerNavbar summary={summary} onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 bg-canvas dp-scroll">
          <div className="max-w-[1280px] mx-auto w-full">
            <DesignerErrorBoundary key={location.pathname}>
              <Outlet />
            </DesignerErrorBoundary>
          </div>
        </main>
      </div>
      <GlobalToast />
    </div>
  );
}
