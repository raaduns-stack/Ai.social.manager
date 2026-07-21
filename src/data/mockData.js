/**
 * mockData.js
 * ---------------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH for all admin fake data.
 *
 * RULE: No admin page should invent its own fake customers/payments/tickets.
 * Every page imports from HERE and filters/derives what it needs, so a
 * customer in User Management is the SAME customer referenced in Billing,
 * Support, and Audit Logs. This is what keeps the demo consistent.
 *
 * Owned jointly by Pascal + Treasure (Phase 0/4 shared foundation task).
 * If you need a new field, add it here and tell the other person — don't
 * fork a local copy in your own page file.
 * ---------------------------------------------------------------------------
 */

// ---------------------------------------------------------------------------
// 1. CUSTOMERS (core entity — almost everything else references customerId)
// ---------------------------------------------------------------------------
export const customers = [
  {
    id: "cus_001",
    name: "Amaka Obi",
    email: "amaka.obi@example.com",
    phone: "+234 803 123 4567",
    status: "active", // active | suspended | deleted
    plan: "pro", // free | starter | pro | enterprise
    accountManager: "Pascal",
    joinedAt: "2026-02-14",
    lastActiveAt: "2026-07-20",
  },
  {
    id: "cus_002",
    name: "Tunde Bakare",
    email: "tunde.bakare@example.com",
    phone: "+234 805 987 6543",
    status: "active",
    plan: "starter",
    accountManager: "Treasure",
    joinedAt: "2026-03-02",
    lastActiveAt: "2026-07-19",
  },
  {
    id: "cus_003",
    name: "Ifeoma Chukwu",
    email: "ifeoma.c@example.com",
    phone: "+234 701 555 1122",
    status: "suspended",
    plan: "free",
    accountManager: "Pascal",
    joinedAt: "2026-01-05",
    lastActiveAt: "2026-06-30",
  },
  {
    id: "cus_004",
    name: "Bright Essien",
    email: "bright.essien@example.com",
    phone: "+234 802 444 8899",
    status: "active",
    plan: "enterprise",
    accountManager: "Treasure",
    joinedAt: "2025-11-20",
    lastActiveAt: "2026-07-21",
  },
];

// ---------------------------------------------------------------------------
// 2. SUBSCRIPTIONS & PLANS
// ---------------------------------------------------------------------------
export const plans = [
  { id: "plan_free", name: "Free", price: 0, currency: "NGN", channels: 1, posts: 1 },
  { id: "plan_starter", name: "Starter", price: 15000, currency: "NGN", channels: 3, posts: 30 },
  { id: "plan_pro", name: "Pro", price: 45000, currency: "NGN", channels: 8, posts: 150 },
  { id: "plan_enterprise", name: "Enterprise", price: 150000, currency: "NGN", channels: 25, posts: 1000 },
];

export const subscriptions = [
  { id: "sub_001", customerId: "cus_001", planId: "plan_pro", status: "active", renewsAt: "2026-08-14" },
  { id: "sub_002", customerId: "cus_002", planId: "plan_starter", status: "active", renewsAt: "2026-08-02" },
  { id: "sub_003", customerId: "cus_003", planId: "plan_free", status: "expired", renewsAt: "2026-07-05" },
  { id: "sub_004", customerId: "cus_004", planId: "plan_enterprise", status: "active", renewsAt: "2026-11-20" },
];

// ---------------------------------------------------------------------------
// 3. PAYMENTS
// ---------------------------------------------------------------------------
export const payments = [
  { id: "pay_001", customerId: "cus_001", amount: 45000, currency: "NGN", status: "verified", date: "2026-07-14", method: "card" },
  { id: "pay_002", customerId: "cus_002", amount: 15000, currency: "NGN", status: "verified", date: "2026-07-02", method: "transfer" },
  { id: "pay_003", customerId: "cus_004", amount: 150000, currency: "NGN", status: "pending", date: "2026-07-20", method: "card" },
];

// ---------------------------------------------------------------------------
// 4. CONNECTED SOCIAL ACCOUNTS
// ---------------------------------------------------------------------------
export const connectedAccounts = [
  { id: "acc_001", customerId: "cus_001", platform: "Instagram", status: "connected", oauthStatus: "valid", connectedAt: "2026-02-15" },
  { id: "acc_002", customerId: "cus_001", platform: "Facebook", status: "connected", oauthStatus: "valid", connectedAt: "2026-02-15" },
  { id: "acc_003", customerId: "cus_002", platform: "TikTok", status: "disconnected", oauthStatus: "expired", connectedAt: "2026-03-03" },
  { id: "acc_004", customerId: "cus_004", platform: "Instagram", status: "connected", oauthStatus: "valid", connectedAt: "2025-11-21" },
];

// ---------------------------------------------------------------------------
// 5. SUPPORT TICKETS
// ---------------------------------------------------------------------------
export const tickets = [
  {
    id: "tkt_001",
    customerId: "cus_002",
    subject: "TikTok account keeps disconnecting",
    status: "open", // open | pending | resolved | closed
    priority: "high",
    assignedTo: "Treasure",
    createdAt: "2026-07-19",
    messages: [
      { from: "customer", text: "My TikTok keeps disconnecting after a day.", at: "2026-07-19 09:12" },
      { from: "admin", text: "Looking into the OAuth token expiry now.", at: "2026-07-19 10:03" },
    ],
  },
  {
    id: "tkt_002",
    customerId: "cus_003",
    subject: "Why was my account suspended?",
    status: "pending",
    priority: "medium",
    assignedTo: "Pascal",
    createdAt: "2026-07-10",
    messages: [
      { from: "customer", text: "I can't log in, it says suspended.", at: "2026-07-10 14:20" },
    ],
  },
];

// ---------------------------------------------------------------------------
// 6. CUSTOMER UPLOADS
// ---------------------------------------------------------------------------
export const uploads = [
  { id: "up_001", customerId: "cus_001", category: "Logos", fileName: "brand-logo.png", status: "approved", uploadedAt: "2026-07-01" },
  { id: "up_002", customerId: "cus_001", category: "Products", fileName: "product-shot-1.jpg", status: "pending", uploadedAt: "2026-07-18" },
  { id: "up_003", customerId: "cus_004", category: "Business Documents", fileName: "cac-certificate.pdf", status: "rejected", uploadedAt: "2026-07-15" },
];

// ---------------------------------------------------------------------------
// 7. AUDIT / ACTIVITY LOGS
// ---------------------------------------------------------------------------
export const auditLogs = [
  { id: "log_001", type: "login", actor: "cus_001", detail: "Logged in from Lagos, NG", at: "2026-07-21 08:02" },
  { id: "log_002", type: "payment", actor: "cus_004", detail: "Payment of ₦150,000 initiated", at: "2026-07-20 16:44" },
  { id: "log_003", type: "publishing", actor: "cus_002", detail: "Post failed to publish to TikTok (token expired)", at: "2026-07-19 09:00" },
  { id: "log_004", type: "system", actor: "system", detail: "Nightly analytics rollup completed", at: "2026-07-21 01:00" },
];

// ---------------------------------------------------------------------------
// 8. NOTIFICATIONS (sent by admin)
// ---------------------------------------------------------------------------
export const notifications = [
  { id: "not_001", type: "subscription_reminder", audience: "cus_003", message: "Your plan expired — renew to keep publishing.", sentAt: "2026-07-06" },
  { id: "not_002", type: "system_announcement", audience: "all", message: "Scheduled maintenance Sunday 2am–4am WAT.", sentAt: "2026-07-18" },
];

// ---------------------------------------------------------------------------
// Helper selectors — use these instead of writing your own .filter() logic
// so lookups stay consistent across pages.
// ---------------------------------------------------------------------------
export const getCustomerById = (id) => customers.find((c) => c.id === id);
export const getSubscriptionByCustomer = (customerId) =>
  subscriptions.find((s) => s.customerId === customerId);
export const getPlanById = (id) => plans.find((p) => p.id === id);
export const getPaymentsByCustomer = (customerId) =>
  payments.filter((p) => p.customerId === customerId);
export const getAccountsByCustomer = (customerId) =>
  connectedAccounts.filter((a) => a.customerId === customerId);
export const getTicketsByCustomer = (customerId) =>
  tickets.filter((t) => t.customerId === customerId);
export const getUploadsByCustomer = (customerId) =>
  uploads.filter((u) => u.customerId === customerId);
