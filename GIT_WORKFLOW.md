# Git & GitHub Workflow — AI Social Media Manager Portal
For: Pascal & Treasure (2 collaborators)

This is written assuming close to zero prior Git experience. Follow it step by step, in order, and you won't hit merge conflicts on shared files.

---

## 1. The Core Idea (read this first)

Git tracks changes to files. GitHub hosts a shared copy of that history online so two people can work on the same project without emailing zip files back and forth.

**Branches** are parallel versions of the codebase. You each work in your own branch so you never directly overwrite each other's work. When your part is ready, you merge it into a shared branch.

You will use **4 branches**:

| Branch | Purpose | Who touches it |
|---|---|---|
| `main` | The final, working, submission-ready code | Nobody works directly here. Only merged into at the very end. |
| `develop` | The shared "current progress" branch — always the latest combined work | Both of you merge into this daily |
| `pascal` | Pascal's personal working branch | Pascal only |
| `treasure` | Treasure's personal working branch | Treasure only |

```
main  ←  (only at final submission)
  ↑
develop  ←  (merge here daily, from both branches)
  ↑              ↑
pascal        treasure
```

---

## 2. One-Time Setup (do this once, together, on Friday morning)

### Step 3 — Push this starter project to GitHub
Whoever is setting up runs this **inside the project folder** (where `package.json` lives):

```bash
git init
git add .
git commit -m "chore: initial project setup with folder structure and shared components"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/ai-social-media-portal.git
git push -u origin main
```

Replace the URL with your actual repo URL (copy it from the green "Code" button on GitHub).

### Step 4 — Create `develop`, `pascal`, and `treasure` branches
Still in the terminal:

```bash
git checkout -b develop
git push -u origin develop

git checkout -b pascal
git push -u origin pascal

git checkout develop
git checkout -b treasure
git push -u origin treasure
```

### Step 5 — The other person clones the repo
The second person (who didn't do Steps 1–4) runs, on their own laptop, in whatever folder they keep projects:

```bash
git clone https://github.com/YOUR-USERNAME/ai-social-media-portal.git
cd ai-social-media-portal
npm install
```

That's it — setup is done. From here on, this is your **daily routine**.

---

## 3. Daily Routine (both of you follow this every session)

### Step 1 — Switch to your own branch and pull the latest `develop` into it
Before you start working each day, bring your branch up to date with whatever the other person merged in yesterday:

```bash
git checkout develop
git pull origin develop

git checkout pascal        # or: git checkout treasure
git merge develop
```

This pulls the other person's finished work into your branch *before* you start, so you're never building on stale code.

### Step 2 — Work normally
Edit files, save, test in the browser (`npm run dev`) as usual. No Git commands needed while you're just coding.

### Step 3 — Commit your work regularly (every 30–60 min, not just once a day)
Small, frequent commits are much easier to recover from mistakes than one giant commit at the end of the day.

```bash
git add .
git commit -m "feat: build billing page current plan and upgrade cards"
```

**Commit message convention** (keep it simple):
- `feat: ...` → new feature/page/component
- `fix: ...` → bug fix
- `style: ...` → visual/CSS-only change
- `chore: ...` → config, setup, non-code changes

### Step 4 — Push your branch to GitHub (end of each work session)

```bash
git push origin pascal      # or: git push origin treasure
```

This backs up your work online and makes it visible to your teammate — but it does **not** touch `develop` or the other person's branch. It's safe to do this as often as you like.

### Step 5 — Merge into `develop` once a feature/page is actually done (not mid-work)
When a page or component is genuinely finished (not half-built), open a **Pull Request**:

1. Go to the repo on GitHub
2. You'll see a banner: "pascal had recent pushes" → click **Compare & pull request**
3. Base: `develop` ← Compare: `pascal` (or `treasure`)
4. Add a short title, e.g. "Billing page complete"
5. Click **Create pull request**
6. Click **Merge pull request** → **Confirm merge**

*(You can each merge your own PRs on a 2-person internship team — you don't need to wait for approval, just don't skip creating the PR, since it keeps a clean history of what was merged and when.)*

### Step 6 — Tell the other person you merged
A quick "just merged Billing into develop, pull when you can" message avoids the other person working on stale code for hours without knowing.

---

## 4. How to Avoid Merge Conflicts (the important part)

A merge conflict happens when **both of you edit the same lines of the same file** on different branches. Most conflicts in this project are avoidable if you follow these rules:

### Rule 1 — Stick to your own page files
Per your task split, Pascal owns files under `pages/Auth/`, `pages/Dashboard/DashboardHome.jsx`, `Analytics.jsx`, `ContentCalendar.jsx`, `AISuggestions.jsx`, `Notifications.jsx`. Treasure owns `pages/Dashboard/Billing.jsx`, `Channels.jsx`, `Uploads.jsx`, `Support.jsx`, `Settings.jsx`. **Never edit a file inside the other person's assigned pages**, even to "quickly fix" something — message them instead.

### Rule 2 — Shared files need a heads-up before editing
These files affect both of you: `App.jsx`, `routes/AppRoutes.jsx`, `components/layout/Sidebar.jsx`, `components/layout/Navbar.jsx`, `tailwind.config.js`, any file in `components/ui/`.

**Before editing any shared file:** say so in your group chat ("editing Sidebar.jsx for 10 mins"), make the change, commit, push, merge to `develop` quickly, then say "done, pull when ready." Don't sit on a shared-file edit for hours uncommitted — that's when conflicts pile up.

### Rule 3 — Pull before you push
Always run `git pull origin develop` into your branch (Step 1 of the daily routine) before starting new work, not just at the start of the day — do it again before merging, too.

### Rule 4 — If a conflict happens anyway
Git will tell you exactly which file(s) conflict when you try to merge:

```
CONFLICT (content): Merge conflict in src/components/layout/Sidebar.jsx
```

Open that file. You'll see markers like this:

```
<<<<<<< HEAD
(your version of the code)
=======
(their version of the code)
>>>>>>> pascal
```

Manually decide what the final version should look like (often it's "keep both changes" — combine them by hand), delete the `<<<<<<<`, `=======`, `>>>>>>>` marker lines, save the file, then:

```bash
git add .
git commit -m "fix: resolve merge conflict in Sidebar.jsx"
```

Don't panic — conflicts are normal and fixable. They just need a human to decide which version (or combination) is correct, since Git can't guess that part.

---

## 5. End-of-Sprint: Merging `develop` into `main`

Only do this once everything is tested and working (Sunday night / Monday morning):

```bash
git checkout main
git pull origin main
git merge develop
git push origin main
```

Or, cleaner: open a Pull Request on GitHub from `develop` → `main`, review the diff, then merge. This gives you one last look at everything before it becomes the "official" submitted version.

---

## 6. Quick Command Cheat Sheet

| What you want to do | Command |
|---|---|
| See which branch you're on | `git branch` |
| Switch branches | `git checkout branch-name` |
| Create + switch to a new branch | `git checkout -b branch-name` |
| Save your changes locally | `git add .` then `git commit -m "message"` |
| Get latest changes from GitHub | `git pull origin branch-name` |
| Send your changes to GitHub | `git push origin branch-name` |
| See what's changed but not committed | `git status` |
| See commit history | `git log --oneline` |

---

## 7. Antigravity IDE Note

Antigravity may create its own local config/cache folders — this repo's `.gitignore` already excludes a generic `.antigravity/` folder. If Antigravity creates a differently-named local folder on your machine, add it to `.gitignore` before your first commit so it doesn't get pushed and clutter the repo for your teammate.
