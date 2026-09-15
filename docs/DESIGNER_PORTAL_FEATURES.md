# Designer Portal — Feature List & Requirements

> **Purpose:** Complete reference for the Designer Portal user stories, feature definitions, and expected behavior. Used to guide implementation decisions, ensure coverage, and verify that every feature described in the brief has a corresponding implementation.

---

## 1. Authentication Modules

### Sign-up / Account Activation
- As a graphic designer, I want to self-register via a link on the landing page so that I can create my account and activate it using the details provided by the organization, so that I can securely access the Designer Portal.
- Org-invited accounts also exist (admin creates designer account) but are out of scope for today.

### Login
- As a graphic designer, I want to securely log into the Graphic Designer Portal using my registered credentials, so that I can access my assigned tasks, submissions, earnings, and other authorized features.

### Forgot Password
- As a graphic designer, I want to reset my password when I forget it, so that I can regain access to my account without contacting an administrator.

### Reset Password
- As a graphic designer, I want to create a new secure password through a password-reset process, so that my account remains protected.

---

## 2. Designer Dashboard

### Overview of Assigned Tasks
- As a designer, I want to view my assigned tasks on the dashboard so that I understand what designs I need to create and complete.

### Recent Submissions
- As a designer, I want to see my most recent design submissions on the dashboard so that I can quickly monitor the work I have recently submitted.

### Submission Status
- As a designer, I want to see the current status of my submitted designs so that I know whether my work is being reviewed, approved, rejected, or requires revision.

### Payment Summary
- As a designer, I want to see a summary of my earnings and payment status on my dashboard so that I can quickly understand what I have earned and what payments are still pending.

### Quick Actions
- As a designer, I want to access frequently used actions directly from my dashboard so that I can perform important tasks without navigating through multiple pages.

**Quick actions include:**

| Action | Description |
|---|---|
| **Upload Design** | Start a new design submission |
| **View Tasks** | View all assigned tasks |
| **My Submissions** | View and track submitted designs |
| **Payments** | View earnings and payment history |
| **Profile** | Manage designer profile information |
| **Notifications** | View important updates |

---

## 3. Upload & Submission

### Upload Completed Graphics
- As a graphic designer, I want to upload one or more completed graphic files so that I can submit my finished work without needing an external platform.

### Select Submission Category
- As a graphic designer, I want to select the appropriate submission category so that my design can be properly classified and processed according to its requirements.

### Add Relevant Details / Instructions
- As a graphic designer, I want to add relevant details, descriptions, and instructions to my submission so that the reviewer or team members can clearly understand the purpose and requirements of my design.

### Track Submission Status
- As a graphic designer, I want to track the status of every design I submit so that I always know whether my work has been received, reviewed, approved, rejected, or returned for revision.

**Submission Lifecycle:**

```
Draft → Submitted → Received → Under Review → Revision Required → Resubmitted → Approved → Completed
```

### Submission Categories

| Category | Description |
|---|---|
| **General Graphics** | Standard graphic design work for classification and review |
| **Hospitality** | Designs for hotels, restaurants, events, food businesses, tourism, and related businesses |
| **Other** | Relevant design categories that do not fit into standard categories |

- Categories should support different requirements where necessary so that I know exactly what information and files I need to provide before submitting.
- **Category-specific requirements = UI hints:** When a category is selected, the UI should display relevant contextual hints, guidance, or tips for that category so the designer knows what to focus on. This is informational, not structural — it does not change the form fields or validation rules, just the UI guidance shown.

### Activity Tracking (within Submissions page)
- Activity tracking is integrated into the Submissions page — not a separate calendar. Designers should be able to see their daily/weekly/monthly activity history directly within the submissions workflow.

### Image-to-Code Integration (within Upload)
- Image-to-code runs on an automated system (likely n8n), but today's focus is on the **UI layer**: guidelines, instructions, and interactivity — not the backend conversion pipeline.
- **Preparation Instructions** — Clear instructions on how to prepare a design for image-to-code conversion so that the graphic can be accurately interpreted and converted into functional code.
- **Upload Process** — Understanding of how to upload a design intended for image-to-code conversion so that the correct files and information are provided for the conversion process.
- **Conversion Explanation** — Understanding of how the uploaded image will be converted into code so that I know what the automated system expects from my design.
- **Guidelines & Examples** — Examples of good image-to-code-ready designs and their expected coded output so that I can create designs the system can reproduce accurately.
- **Technical Instructions** — The ability to add technical instructions to an image-to-code submission so that important interactions or behaviors that cannot be understood from the static image are communicated to the system.

### Complete Upload & Submission Workflow
- As a graphic designer, I want one complete upload and submission workflow where I can upload my design, select its category, provide instructions, use image-to-code guidance where necessary, and track the submission status — managing the entire lifecycle of my design work from one place.

---

## 4. Settings

### Designer Profile
- As a graphic designer, I want to view and update my professional profile so that my personal and professional information remains accurate and up to date.

### Account Settings
- As a graphic designer, I want to manage my account settings so that I can control my account information and preferences.

### Notification Preferences
- As a graphic designer, I want to manage my notification preferences so that I can control how and when I receive updates about my work, submissions, tasks, and payments.

### Password / Security Settings
- As a graphic designer, I want to manage my password and account security so that my account, designs, submissions, and payment information remain protected.

---

## 5. Payments

> **Note:** This is a **seller-side payout** flow — separate from the customer subscription checkout (Flutterwave) used in the customer portal. Designers receive earnings from approved work; they do not subscribe or pay.

### Payment Information
- As a graphic designer, I want to add and manage my payment information so that the organization can pay my approved earnings to the correct account.

### Earnings / Payment History
- As a graphic designer, I want to view my earnings and complete payment history so that I can track how much I have earned from my completed and approved design work.

### Payment Status
- As a graphic designer, I want to see the current status of each payment so that I know whether my earnings are pending, processing, paid, or require attention.

### Payment Integration
- As a graphic designer, I want to securely connect my approved payment method to the portal so that my earnings can be processed and paid electronically without unnecessary manual intervention.

---

## Implementation Context & Decisions

> Notes from planning sessions to guide implementation decisions.

- **Auth:** Self-service registration via landing page link is in scope. Org-invited accounts (admin creates designer account) exist but are out of scope.
- **Payments:** Seller-side payout flow — separate from customer Flutterwave subscription checkout.
- **Image-to-Code:** Automated system (likely n8n), but today's focus is UI layer only — guidelines, instructions, and interactivity.
- **Activity:** No separate activity calendar. Activity tracking is integrated into the Submissions page (daily/weekly/monthly history within the submissions workflow).
- **Reviewer Actions:** Performed in the Admin Panel, not the Designer Portal. Designer portal submits → admin reviews → status updates flow back to designer.
- **Category-Specific Requirements:** UI hints shown when a category is selected — contextual guidance, not structural form changes.
- **Scope for today:** Self-service UI flow completion, UI perfection pass, backend module, database schemas, and portal integration.
