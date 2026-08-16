/**
 * NotFound.jsx
 * Catch-all for unmatched /admin/* routes.
 */
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl font-semibold text-[#FF6600]">404</p>
      <h1 className="mt-2 text-lg font-semibold text-[#111827]">Page not found</h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        The admin page you're looking for doesn't exist.
      </p>
      <Link
        to="/admin/dashboard"
        className="mt-6 rounded-lg bg-[#FF6600] px-4 py-2 text-sm font-medium text-white"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
