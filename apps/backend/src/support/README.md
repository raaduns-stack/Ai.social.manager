# Support Module

This module manages the customer support tickets and staff assignment logic.

## Responsibilities
- **Customer Support**: Allows customers to create and view tickets, and reply to open or resolved tickets.
- **Admin Support**: Allows staff to view tickets, assign tickets to themselves or others, change statuses, and respond.

## Role-Based Access Control (RBAC)
Ticket assignments strictly follow these rules:
- **`super_admin`**: Can assign or reassign any ticket to any staff member.
- **Other Staff Roles (e.g., `account_manager`, `reviewer`, `designer`)**: Can only assign unassigned tickets to themselves (i.e., self-claim). They cannot assign tickets to other staff members or claim a ticket already assigned to someone else.

## Auto-Close Behavior
To ensure resolved tickets don't clutter the active queue permanently, an automated cron job (`AutoCloseTicketsJob`) runs every hour. 
- It queries for tickets with `status = 'resolved'` where the `resolvedAt` timestamp is older than **72 hours**.
- Matches are automatically updated to `status = 'closed'`.
- **Note:** Tickets are never deleted. Customers can reply to a closed ticket? (Actually, current logic prevents replying to closed tickets, requiring a new ticket).
