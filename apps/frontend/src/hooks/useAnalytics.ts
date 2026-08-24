import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function getTitleFromPath(pathname: string): string {
  const exactTitles: Record<string, string> = {
    '/': 'Home',
    '/features': 'Features',
    '/pricing': 'Pricing',
    '/contact': 'Contact Us',
    '/login': 'Login',
    '/signup': 'Sign Up',
    '/forgot-password': 'Forgot Password',
    '/verify-email': 'Verify Email',
    '/welcome': 'Welcome',
    '/setup/business': 'Business Setup',
    '/choose-plan': 'Choose Plan',
    '/payment': 'Payment',
    '/payment-verification': 'Payment Verification',
    '/payments/callback': 'Payment Callback',
    '/dashboard': 'Dashboard',
    '/dashboard/analytics': 'Analytics',
    '/dashboard/channels': 'Social Channels',
    '/dashboard/calendar': 'Content Calendar',
    '/dashboard/uploads': 'Brand Assets',
    '/dashboard/billing': 'Billing',
    '/dashboard/support': 'Support',
    '/dashboard/notifications': 'Notifications',
    '/dashboard/settings': 'Settings',
    '/admin': 'Admin Dashboard',
    '/admin/dashboard': 'Admin Dashboard',
    '/admin/users': 'Admin Users',
    '/admin/calendar': 'Admin Content Calendar',
    '/admin/ai-content': 'Admin AI Content',
    '/admin/notifications': 'Admin Notifications',
    '/admin/logs': 'Admin Audit Logs',
    '/admin/staff': 'Admin Staff Dashboard',
    '/admin/staff/manage': 'Admin Manage Staff',
    '/admin/staff/roles-permissions': 'Admin Roles & Permissions',
    '/admin/staff/login-history': 'Admin Login History',
    '/admin/staff/activity-logs': 'Admin Activity Logs',
    '/admin/billing': 'Admin Billing',
    '/admin/social-accounts': 'Admin Social Accounts',
    '/admin/uploads': 'Admin Uploads',
    '/admin/kyc': 'Admin KYC Verification',
    '/admin/money-management': 'Admin Money Management',
    '/admin/analytics': 'Admin Analytics',
    '/admin/ai-config': 'Admin AI Configuration',
    '/admin/support': 'Admin Support',
    '/admin/faqs': 'Admin FAQs',
    '/admin/settings': 'Admin Settings',
    '/admin/access-restricted': 'Admin Access Restricted',
    '/admin/login': 'Admin Login',
    '/admin/forgot-password': 'Admin Forgot Password',
  };

  if (exactTitles[pathname]) {
    return exactTitles[pathname];
  }

  // Dynamic prefix matches
  if (pathname.startsWith('/admin/users/')) {
    if (pathname.endsWith('/calendar')) {
      return 'Admin User Calendar';
    }
    return 'Admin User Details';
  }

  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return 'Customer Portal';

  const lastPart = parts[parts.length - 1];
  return lastPart
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // 1. Update document title dynamically
    const pageTitle = getTitleFromPath(location.pathname);
    document.title = `Raa Social — ${pageTitle}`;

    // 2. Track page view in analytics if configured
    if ((window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
}

