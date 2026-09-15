// Every new table (subscriptions, posts, content_calendar, uploads, etc.)
// gets its own file in this folder and is re-exported here, so the rest of
// the app just does `import * as schema from '@/database/schema'`.
export * from './users.schema';
export * from './plans.schema';
export * from './subscriptions.schema';
export * from './payments.schema';
export * from './invoices.schema';
export * from './social-accounts.schema';
export * from './support-tickets.schema';
export * from './faqs.schema';
export * from './uploads.schema';
export * from './content-feedback.schema';
export * from './content-suggestions.schema';
export * from './content-calendar.schema';
export * from './calendar-generation-jobs.schema';
export * from './ai-prompt-templates.schema';
export * from './settings.schema';
export * from './kyc.schema';
export * from './login-history.schema';
export * from './activity-logs.schema';
export * from './role-permissions.schema';
export * from './scheduled-posts.schema';
export * from './publishing-logs.schema';
export * from './designer-profiles.schema';
export * from './tasks.schema';
export * from './submissions.schema';
export * from './designer-payments.schema';
export * from './designer-notifications.schema';
export * from './image-to-code.schema';
export * from './designer-invitations.schema';
export * from './notifications.schema';
export * from './scheduled-notifications.schema';
export * from './designer-profiles.schema';
export * from './tasks.schema';
export * from './submissions.schema';
export * from './designer-payments.schema';
export * from './designer-notifications.schema';
export * from './image-to-code.schema';
export * from './designer-invitations.schema';
export * from './relations';


