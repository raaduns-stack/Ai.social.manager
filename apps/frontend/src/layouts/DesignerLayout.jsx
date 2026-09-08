/**
 * DesignerLayout.jsx
 * Shell for /designer/* — mirrors AdminLayout/DashboardLayout.
 */
import { useState } from "react";
import { Outlet } from "react-router-dom";
import DesignerSidebar from "../components/layout/DesignerSidebar";
import DesignerNavbar from "../components/layout/DesignerNavbar";
import GlobalToast from "../components/ui/GlobalToast";
import "../styles/designer-premium.css";

export default function DesignerLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="designer-premium flex h-screen w-full overflow-hidden bg-canvas text-ink font-sans">
      <DesignerSidebar className="hidden md:flex h-screen shrink-0 border-r border-border bg-white" />

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <DesignerSidebar
            className="relative flex w-64 flex-col bg-white h-full shadow-2xl z-10"
            onClose={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <DesignerNavbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 bg-canvas dp-scroll">
          <div className="max-w-[1280px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
      <GlobalToast />
    </div>
  );
}
