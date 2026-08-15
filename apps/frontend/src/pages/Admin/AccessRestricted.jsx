import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AccessRestricted() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md p-8 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-center flex flex-col items-center">
        <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-[#EF4444]/10 text-[#EF4444] animate-pulse">
          <ShieldAlert size={36} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827] mb-3">
          Access Restricted
        </h1>
        <p className="text-sm text-[#4B5563] leading-relaxed mb-8">
          You do not have the required administrative permissions to access this page. If you believe this is a mistake, please contact your primary account administrator.
        </p>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#FF6600] hover:bg-[#E05300] focus:ring-4 focus:ring-[#FF6600]/50 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg shadow-[#FF6600]/20"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
