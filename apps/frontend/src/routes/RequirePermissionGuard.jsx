import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { useAdminAuth } from '../context/useAdminAuth';

export default function RequirePermissionGuard({ module, action = 'view', children }) {
  const { loading } = useAdminAuth();
  const isAllowed = usePermission(module, action);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#FF6600] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAllowed) {
    return <Navigate to="/admin/access-restricted" replace />;
  }

  return children;
}
