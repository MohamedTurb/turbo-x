# TurboX Project Complete Map

## 1) Project Overview

### Project name
TurboX

### Project purpose
TurboX is a learning management and quiz/assignment platform for students and administrators. The current codebase supports:
- student login
- role-based redirect after login
- quiz publishing and taking
- quiz attempts and score tracking
- assignment publishing and submission uploads
- admin dashboard for managing quizzes, assignments, and students

### Tech stack
- Framework: Next.js 15 (App Router)
- Language: TypeScript
- UI/library stack: React 19, Next.js, Tailwind CSS, Supabase JS/SSR
- Styling: Tailwind CSS utility classes + custom CSS in `app/globals.css`
- Animation: no dedicated animation library is present in the dependency list; the app uses transitions and CSS motion only
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth via `@supabase/ssr` and `supabase.auth.signInWithPassword()`
- Storage: Supabase Storage
- Deployment platform: no deployment config is present in the repository; Vercel is referenced only as a general possibility in `.gitignore`/Next conventions, but there is no actual Vercel config committed here
- Package manager: npm (`package-lock.json` is present; no yarn.lock or pnpm-lock.yaml)
- Important package versions (from `package.json`):
  - `next`: `15.5.25`
  - `react`: `^19.0.0`
  - `react-dom`: `^19.0.0`
  - `@supabase/ssr`: `^0.5.2`
  - `@supabase/supabase-js`: `^2.45.4`
  - `xlsx`: `^0.18.5`
  - `tailwindcss`: `^3.4.13`
  - `typescript`: `^5`
  - `eslint`: `^9`

### Environment variables
Only environment variables defined in the repo are documented in `.env.example`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

There is no committed `.env`, `.env.local`, or real value file in the workspace. The runtime checks in the Supabase clients will throw if these values are absent.

### External services
- Supabase Auth
- Supabase Postgres database
- Supabase Storage
- Excel export via `xlsx` library

### Architectural decisions
The app intentionally uses a direct client-side Supabase access pattern instead of API routes:
- Client pages call `supabaseBrowser()` directly
- The app uses Supabase Row Level Security (RLS) to enforce role-based access in the database
- Role semantics are stored in the `public.profiles` table as `student` or `admin`
- The app does not implement a separate REST API or server-side route handler layer
- There is no custom middleware or page-level server auth gate in the repo

### Overall architecture in simple terms
This is a small Next.js app whose pages read and write data via Supabase from the browser. Students log in, their profile is fetched by auth user id, and the UI redirects them to their role-specific pages. Admin pages fetch students, quizzes, attempts, and assignments from the same Supabase project. Quiz attempts and submissions are stored in database tables. Assignment files are uploaded to a Supabase storage bucket; metadata is stored in the `assignments` and `submissions` tables.

---

## 2) Complete Folder Tree

```text
E:\turbo-x
├── .env.example
├── .gitignore
├── README.md
├── eslint.config.mjs
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── app/
│   ├── admin/
│   │   └── page.tsx
│   ├── assignments/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── globals.css
│   ├── grades/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── page.tsx
│   ├── quiz/
│   │   └── [id]/
│   │       └── page.tsx
│   └── quizzes/
│       └── page.tsx
├── components/
│   ├── EmptyState.tsx
│   ├── Loading.tsx
│   ├── Navbar.tsx
│   ├── QuestionForm.tsx
│   ├── QuizCard.tsx
│   ├── QuizForm.tsx
│   └── StatCard.tsx
├── lib/
│   ├── supabase-browser.ts
│   ├── supabase-server.ts
│   ├── types.ts
│   └── supbase/
│       └── client.ts
├── supabase/
│   ├── diagnostics.sql
│   └── schema.sql
└── public/
    (not present in the current workspace)
```

### Important file inventory

#### `.env.example`
Purpose: provides the required environment variable names for Supabase connection.
Exports: none.
Imports: none.
Depends on: local `.env.local` setup outside the repo.
Used by: `lib/supabase-browser.ts`, `lib/supabase-server.ts`.
Current status: present, but values are blank placeholders.

#### `package.json`
Purpose: declares app metadata, scripts, dependencies, and devDependencies.
Exports: scripts for `dev`, `build`, `start`, and `lint`.
Imports: none.
Depends on: npm ecosystem and the installed dependency tree.
Used by: local development and build processes.
Current status: active.

#### `next.config.ts`
Purpose: configures Next.js build behavior.
Exports: a `NextConfig` object.
Imports: `NextConfig` from `next`.
Depends on: Next.js defaults.
Used by: Next.js build process.
Current status: active; it only disables ESLint during builds.

#### `tailwind.config.ts`
Purpose: defines Tailwind content paths and theme extensions.
Exports: `config`.
Imports: `Config` from `tailwindcss`.
Depends on: Tailwind and the app file structure.
Used by: styling across app and components.
Current status: active.

#### `app/layout.tsx`
Purpose: root layout, page metadata, dark theme shell.
Exports: `metadata` and default `RootLayout`.
Imports: `Metadata` from `next` and `./globals.css`.
Depends on: global CSS and Next App Router.
Used by: all app pages.
Current status: active.

#### `app/page.tsx`
Purpose: landing page / home marketing page for the product.
Exports: default `LandingPage`.
Imports: `Link` from `next/link`.
Depends on: no database or backend.
Used by: route `/`.
Current status: active.

#### `app/login/page.tsx`
Purpose: login page, password authentication, role-based redirect.
Exports: default `LoginPage`.
Imports: `useState`, `Link`, `useRouter`, `supabaseBrowser`.
Depends on: Supabase Auth and `profiles` table.
Used by: route `/login`.
Current status: active.

#### `app/dashboard/page.tsx`
Purpose: student dashboard with progress summary.
Exports: default `DashboardPage`.
Imports: `useEffect`, `useState`, `Link`, `useRouter`, `supabaseBrowser`, `Navbar`, `StatCard`, `Loading`, types.
Depends on: `profiles` and `quiz_attempts` tables.
Used by: route `/dashboard`.
Current status: active.

#### `app/quizzes/page.tsx`
Purpose: student list of published quizzes.
Exports: default `QuizzesPage`.
Imports: `useEffect`, `useState`, `useRouter`, `supabaseBrowser`, `Navbar`, `QuizCard`, `EmptyState`, `Loading`, types.
Depends on: `profiles`, `quizzes`, `questions` tables.
Used by: route `/quizzes`.
Current status: active.

#### `app/quiz/[id]/page.tsx`
Purpose: dynamic quiz-taking experience with timer, answer selection, and scoring.
Exports: default `QuizPage`.
Imports: `useCallback`, `useEffect`, `useMemo`, `useState`, `useParams`, `useRouter`, `supabaseBrowser`, `Navbar`, `Loading`, types.
Depends on: `profiles`, `quizzes`, `questions`, `quiz_attempts` tables.
Used by: route `/quiz/[id]`.
Current status: active.

#### `app/assignments/page.tsx`
Purpose: student assignment list, download, and upload submission flow.
Exports: default `AssignmentsPage`.
Imports: `useCallback`, `useEffect`, `useState`, `useRouter`, `supabaseBrowser`, `Navbar`, `Loading`, `EmptyState`, types.
Depends on: `profiles`, `assignments`, `submissions`, Supabase Storage bucket `assignments`.
Used by: route `/assignments`.
Current status: active.

#### `app/grades/page.tsx`
Purpose: student grade history page.
Exports: default `GradesPage`.
Imports: `useEffect`, `useState`, `useRouter`, `supabaseBrowser`, `Navbar`, `EmptyState`, `Loading`, types.
Depends on: `profiles`, `quiz_attempts`, `quizzes` via join.
Used by: route `/grades`.
Current status: active.

#### `app/admin/page.tsx`
Purpose: admin dashboard with stats, quiz creation, assignment creation, export to Excel, and viewing students.
Exports: default `AdminPage`.
Imports: `useCallback`, `useEffect`, `useState`, `Link`, `useRouter`, `XLSX`, `supabaseBrowser`, `Navbar`, `StatCard`, `QuizForm`, `Loading`, `EmptyState`, types.
Depends on: `profiles`, `quizzes`, `questions`, `quiz_attempts`, `assignments`, `submissions`, Supabase Storage bucket `assignments`.
Used by: route `/admin`.
Current status: active but limited to the features present in this repo.

#### `components/Navbar.tsx`
Purpose: app navigation and logout behavior.
Exports: default `Navbar`.
Imports: `useState`, `Link`, `useRouter`, `supabaseBrowser`, role type.
Depends on: supabase browser client.
Used by: most student and admin pages.
Current status: active.

#### `components/QuizForm.tsx`
Purpose: admin form to create a quiz and its questions.
Exports: default `QuizForm`.
Imports: `useState`, `supabaseBrowser`, `QuestionDraft` type, `QuestionForm` component.
Depends on: `quizzes` and `questions` tables.
Used by: `app/admin/page.tsx`.
Current status: active.

#### `components/QuestionForm.tsx`
Purpose: UI for editing one quiz question including options and correct answer selection.
Exports: default `QuestionForm`.
Imports: `QuestionDraft` type.
Depends on: parent `QuizForm`.
Used by: `components/QuizForm.tsx`.
Current status: active.

#### `components/QuizCard.tsx`
Purpose: card UI for each quiz on the student quiz list.
Exports: default `QuizCard`.
Imports: likely quiz type only.
Depends on: `QuizWithCount` type and row data.
Used by: `app/quizzes/page.tsx`.
Current status: active.

#### `components/StatCard.tsx`
Purpose: summary metric card used in dashboard/admin pages.
Exports: default `StatCard`.
Imports: none besides React default.
Depends on: simple UI wrapper.
Used by: admin dashboard and student dashboard.
Current status: active.

#### `components/EmptyState.tsx`
Purpose: utility empty state message display.
Exports: default `EmptyState`.
Imports: none.
Depends on: UI layout.
Used by: admin, quizzes, grades, assignments.
Current status: active.

#### `components/Loading.tsx`
Purpose: loading placeholder UI.
Exports: default `Loading`.
Imports: none.
Depends on: none.
Used by: pages that fetch data before rendering.
Current status: active.

#### `lib/types.ts`
Purpose: TypeScript interfaces for `Profile`, `Quiz`, `Question`, `QuizAttempt`, `Assignment`, `Submission`, etc.
Exports: type aliases and interfaces.
Imports: none.
Depends on: nothing external.
Used by: most page and component files.
Current status: active.

#### `lib/supabase-browser.ts`
Purpose: create a browser Supabase client from public env vars.
Exports: `supabaseBrowser()`.
Imports: `createBrowserClient` from `@supabase/ssr`.
Depends on: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Used by: all client pages and components that query Supabase.
Current status: active; throws if env vars are missing.

#### `lib/supabase-server.ts`
Purpose: create a server-side Supabase client for server components or server actions.
Exports: `supabaseServer()`.
Imports: `cookies` and `createServerClient` from `@supabase/ssr`.
Depends on: same env vars as the browser client.
Used by: no current repo file appears to import it.
Current status: present but not obviously used by the current app.

#### `lib/supbase/client.ts`
Purpose: alternate browser client helper; duplicates the logic from `lib/supabase-browser.ts`.
Exports: `createClient()`.
Imports: `createBrowserClient` from `@supabase/ssr`.
Depends on: same env vars.
Used by: no imports found in the current repository.
Current status: present but apparently unused.

#### `supabase/schema.sql`
Purpose: database schema definition and RLS policies.
Exports: none, but creates DB structures when run in Supabase SQL editor.
Imports: none.
Depends on: Supabase Postgres environment and authentication table `auth.users`.
Used by: the live Supabase database.
Current status: active as schema source of truth, but there is no migration history beyond this file.

#### `supabase/diagnostics.sql`
Purpose: SQL utilities for debugging RLS and role setup.
Exports: none.
Imports: none.
Depends on: live database.
Used by: debugging or verification in Supabase SQL editor.
Current status: support script only.

---

## 3) Complete Route Map

### Public storefront routes

#### `/`
File: `app/page.tsx`
Page/component: `LandingPage`
Purpose: marketing landing page with hero, CTA, and feature pillars.
Authentication requirement: none
Admin permission requirement: none
Important components used: `Link`
Database/API dependencies: none
Dynamic parameters: none
Status: Active

#### `/login`
File: `app/login/page.tsx`
Page/component: `LoginPage`
Purpose: sign in by email/password; redirect by role
Authentication requirement: not authenticated before login; sign-in required to continue
Admin permission requirement: none for viewing page itself
Important components used: `Link`, `useRouter`
Database/API dependencies: Supabase Auth; `profiles` table
Dynamic parameters: none
Status: Active

### Student routes

#### `/dashboard`
File: `app/dashboard/page.tsx`
Page/component: `DashboardPage`
Purpose: user dashboard with stats and links to quiz/assignment/grade areas
Authentication requirement: authenticated session required
Admin permission requirement: no admin role required; admin user is redirected away
Important components used: `Navbar`, `StatCard`, `Loading`
Database/API dependencies: `profiles`, `quiz_attempts`
Dynamic parameters: none
Status: Active

#### `/quizzes`
File: `app/quizzes/page.tsx`
Page/component: `QuizzesPage`
Purpose: list published quizzes for the signed-in student
Authentication requirement: authenticated session required
Admin permission requirement: no admin role required; admin is redirected to `/admin`
Important components used: `Navbar`, `QuizCard`, `EmptyState`, `Loading`
Database/API dependencies: `profiles`, `quizzes`, `questions`
Dynamic parameters: none
Status: Active

#### `/quiz/[id]`
File: `app/quiz/[id]/page.tsx`
Page/component: `QuizPage`
Purpose: present a single quiz, record answers, manage timer, submit, and display result
Authentication requirement: authenticated session required
Admin permission requirement: admin users are redirected to `/admin`
Important components used: `Navbar`, `Loading`
Database/API dependencies: `profiles`, `quizzes`, `questions`, `quiz_attempts`
Dynamic parameters: `id` (quiz id)
Status: Active

#### `/assignments`
File: `app/assignments/page.tsx`
Page/component: `AssignmentsPage`
Purpose: list assignments, download files, and submit replacements or new files
Authentication requirement: authenticated session required
Admin permission requirement: admin users are redirected to `/admin`
Important components used: `Navbar`, `Loading`, `EmptyState`
Database/API dependencies: `profiles`, `assignments`, `submissions`, Supabase Storage bucket `assignments`
Dynamic parameters: none
Status: Active

#### `/grades`
File: `app/grades/page.tsx`
Page/component: `GradesPage`
Purpose: show the student’s quiz attempt history and percentages
Authentication requirement: authenticated session required
Admin permission requirement: admin users are redirected to `/admin`
Important components used: `Navbar`, `EmptyState`, `Loading`
Database/API dependencies: `profiles`, `quiz_attempts`, `quizzes`
Dynamic parameters: none
Status: Active

### Admin routes

#### `/admin`
File: `app/admin/page.tsx`
Page/component: `AdminPage`
Purpose: admin overview page for quiz creation, assignment creation, student export, and admin stats
Authentication requirement: authenticated session required
Admin permission requirement: profile role must be `admin`
Important components used: `Navbar`, `StatCard`, `QuizForm`, `Loading`, `EmptyState`, `XLSX`
Database/API dependencies: `profiles`, `quizzes`, `questions`, `quiz_attempts`, `assignments`, `submissions`, Supabase Storage bucket `assignments`
Dynamic parameters: none
Status: Active

### API routes
No `app/api` folder or `route.ts` files were found in the repo. No API route handlers or REST endpoints are currently implemented in this project.

### Auth routes
Aside from `/login`, no sign-up, reset-password, callback, or OAuth route was found in the repo.

### Other routes
None discovered beyond the routes above.

---

## 4) Complete API Map

No API routes were discovered in the current codebase.

### Verification result
- Search for `app/api/**` : not found
- Search for `route.ts` and `route.js`: not found
- Search for `NextResponse` / `Request` / `Response` route handlers: no results in the repo

### API status
- Total API routes found: 0
- Current status: no API layer implemented by the current project code

### Direct database access pattern used instead of API routes
All page components interact directly with Supabase from the browser using `supabaseBrowser()`:
- `app/login/page.tsx`
- `app/admin/page.tsx`
- `app/dashboard/page.tsx`
- `app/quizzes/page.tsx`
- `app/quiz/[id]/page.tsx`
- `app/assignments/page.tsx`
- `app/grades/page.tsx`

### Endpoint inventory
None.

---

## 5) Complete Component Map

### `Navbar`
File: `components/Navbar.tsx`
Purpose: navigation bar for both admin and student flows; also handles logout.
Props: `role`, `name`, `email`
State: `loggingOut`
Hooks: `useState`, `useRouter`
Context/providers: none
Components it uses: `Link`
Pages that use it: all major authenticated pages (`/dashboard`, `/quizzes`, `/assignments`, `/grades`, `/admin`, `/quiz/[id]`)
API/database dependencies: `supabaseBrowser().auth.signOut()`
Responsive behavior: desktop nav hidden on small screens while mobile scrolling nav is shown; `sm:hidden` mobile nav
Desktop behavior: full nav bar and student/admin links
Mobile behavior: horizontal nav with overflow and reduced width layout
Status: Active

### `QuizForm`
File: `components/QuizForm.tsx`
Purpose: create a quiz with title, description, time limit, publish flag, and multiple questions
Props: `onCreated`, `onCancel`
State:
- `title`
- `description`
- `published`
- `durationMinutes`
- `questions`
- `submitting`
- `error`
- `success`
Hooks: `useState`
Context/providers: none
Components it uses: `QuestionForm`
Pages that use it: `app/admin/page.tsx`
API/database dependencies: inserts to `quizzes` and `questions`
Responsive behavior: form uses grid layouts with `sm:` breakpoints
Desktop behavior: full width form with side-by-side fields on larger screens
Mobile behavior: stacked fields; buttons full width on small screens
Status: Active

### `QuestionForm`
File: `components/QuestionForm.tsx`
Purpose: individual question editor with 4 options and correct-answer selection
Props: `index`, `question`, `onChange`, `onRemove`, `canRemove`
State: none local; managed by parent `QuizForm`
Hooks: none
Context/providers: none
Components it uses: none
Pages that use it: `components/QuizForm.tsx`
API/database dependencies: none directly; output is passed to quiz insert
Responsive behavior: grid collapses to stacked layout on small screens
Desktop behavior: double-column option grid
Mobile behavior: single-column stacked layout
Status: Active

### `QuizCard`
File: `components/QuizCard.tsx`
Purpose: card display for a published quiz listing item
Props: `quiz`
State: none
Hooks: none
Context/providers: none
Components it uses: `Link` likely
Pages that use it: `app/quizzes/page.tsx`
API/database dependencies: reads `QuizWithCount` row data
Responsive behavior: sits in a grid of cards
Desktop behavior: cards in a 3-column grid at larger screens
Mobile behavior: stacked or 2-column grid depending viewport
Status: Active

### `StatCard`
File: `components/StatCard.tsx`
Purpose: simple metric card UI
Props: `label`, `value`, `suffix` (optional)
State: none
Hooks: none
Context/providers: none
Components it uses: none
Pages that use it: `app/dashboard/page.tsx`, `app/admin/page.tsx`
API/database dependencies: none directly
Responsive behavior: grid-based summary cards
Desktop behavior: 2 or 4 cards per row depending page
Mobile behavior: 2-per-row on small screens, 1-per-row where required by CSS
Status: Active

### `Loading`
File: `components/Loading.tsx`
Purpose: loader component with message
Props: `label` optional
State: none
Hooks: none
Context/providers: none
Components it uses: none
Pages that use it: all pages that wait on session/profile fetches
API/database dependencies: none directly
Responsive behavior: center-aligned spinner/message
Desktop/mobile behavior: same layout across screen sizes
Status: Active

### `EmptyState`
File: `components/EmptyState.tsx`
Purpose: empty state component
Props: `title`, `description` optional
State: none
Hooks: none
Context/providers: none
Components it uses: none
Pages that use it: `app/quizzes/page.tsx`, `app/admin/page.tsx`, `app/grades/page.tsx`, `app/assignments/page.tsx`
API/database dependencies: none directly
Responsive behavior: centered card or message block
Desktop/mobile behavior: same across devices
Status: Active

---

## 6) Supabase / Database Map

### Supabase project configuration
The repo does not include a committed Supabase project URL or anon key values. The project references them via environment variables only:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

No `.env` file is present in the workspace, so the live project connection cannot be verified from the repository alone.

### Database schema source
File: `supabase/schema.sql`
Purpose: creates the TurboX schema and RBAC policies.

### Tables discovered

#### TABLE: `public.profiles`
Purpose: user profile metadata and role assignment. It is linked to `auth.users` by `id`.
Columns:
- `id` uuid primary key, references `auth.users(id)`, cascade delete
- `full_name` text nullable
- `role` text not null, allowed values: `student`, `admin`
- `created_at` timestamptz not null default `now()`
Relationships:
- one-to-one with `auth.users`
- many quiz attempts and submissions reference this table via `student_id`
RLS:
- `profiles_select_own`
- `profiles_select_admin`
- `profiles_update_own`
- `profiles_insert_own`
Used by:
- login flow (`app/login/page.tsx`)
- dashboards and quiz pages
- admin student aggregation
API routes: none
Pages: `/login`, `/dashboard`, `/admin`, `/quizzes`, `/quiz/[id]`, `/grades`, `/assignments`
Admin pages: `/admin`
Important notes: no email column exists in this table; UI code that expects `s.email` is calling a field not defined by schema.

#### TABLE: `public.quizzes`
Purpose: quiz metadata, publication state, and time limit.
Columns:
- `id` bigint generated identity primary key
- `title` text not null
- `description` text nullable
- `published` boolean not null default false
- `created_at` timestamptz not null default now()
- Note: `duration_minutes` is referenced in the app but is not present in this table definition. In `app/quiz/[id]/page.tsx` the app reads `quiz.duration_minutes` and in `QuizForm` it inserts `duration_minutes`. The SQL schema shown here does not create that column. This is a schema mismatch.
Relationships:
- one-to-many with `questions`
- one-to-many with `quiz_attempts`
RLS:
- `quizzes_select_published`
- `quizzes_insert_admin`
- `quizzes_update_admin`
- `quizzes_delete_admin`
Used by:
- admin quiz creation
- student quiz listing and taking
API routes: none
Pages: `/admin`, `/quizzes`, `/quiz/[id]`
Admin pages: `/admin`
Important notes: current schema is missing the `duration_minutes` field used by code.

#### TABLE: `public.questions`
Purpose: question text, multiple-choice options, correct answer, points.
Columns:
- `id` bigint generated identity primary key
- `quiz_id` bigint not null references `public.quizzes(id)` on delete cascade
- `question_text` text not null
- `options` jsonb not null
- `correct_answer` text not null
- `points` integer not null default 1
Relationships:
- many questions connect to one quiz
RLS:
- `questions_select_published_or_admin`
- `questions_insert_admin`
- `questions_update_admin`
- `questions_delete_admin`
Used by:
- quiz creation flow
- quiz-taking flow
API routes: none
Pages: `/admin`, `/quiz/[id]`
Admin pages: `/admin`
Important notes: options are stored as JSONB rather than normalized columns.

#### TABLE: `public.quiz_attempts`
Purpose: stores each submitted quiz result by a student.
Columns:
- `id` bigint generated identity primary key
- `quiz_id` bigint not null references `public.quizzes(id)` on delete cascade
- `student_id` uuid not null references `public.profiles(id)` on delete cascade
- `score` numeric not null default 0
- `total_points` numeric not null default 0
- `percentage` numeric not null default 0
- `created_at` timestamptz not null default now()
Relationships:
- many attempts belong to one quiz
- many attempts belong to one student profile
RLS:
- `attempts_select_own_or_admin`
- `attempts_insert_own`
Used by:
- quiz submission results
- student dashboard and grades pages
API routes: none
Pages: `/quiz/[id]`, `/dashboard`, `/grades`
Admin pages: `/admin` on stats read-only access
Important notes: no update or delete policy is defined after insert; the comments state this intentionally blocks edits.

#### TABLE: `public.assignments`
Purpose: assignment metadata and downloadable file pointer.
Columns:
- `id` bigint generated identity primary key
- `title` text not null
- `description` text nullable
- `file_path` text nullable
- `due_date` timestamptz nullable
- `created_at` timestamptz not null default now()
Relationships:
- one-to-many with `submissions`
RLS:
- `assignments_select_all`
- `assignments_insert_admin`
- `assignments_update_admin`
- `assignments_delete_admin`
Used by:
- admin assignment creation
- student assignment downloads and submissions
API routes: none
Pages: `/admin`, `/assignments`
Admin pages: `/admin`
Important notes: code uploads storage files into the `assignments` bucket and stores the object path in `file_path`.

#### TABLE: `public.submissions`
Purpose: each student’s submitted assignment file and grade metadata.
Columns:
- `id` bigint generated identity primary key
- `assignment_id` bigint not null references `public.assignments(id)` on delete cascade
- `student_id` uuid not null references `public.profiles(id)` on delete cascade
- `file_path` text nullable
- `grade` numeric nullable
- `feedback` text nullable
- `created_at` timestamptz not null default now()
Relationships:
- many submissions belong to one assignment
- many submissions belong to one student
RLS:
- `submissions_select_own_or_admin`
- `submissions_insert_own`
- `submissions_update_admin`
Used by:
- assignment upload flow
- admin assignment management (indirectly)
API routes: none
Pages: `/assignments`
Admin pages: `/admin` (indirect via student file metadata but no dedicated admin management screen)
Important notes: the app only allows the student to insert and update their own row; admin updates are allowed via RLS for grading workflow, though the current UI does not implement grading.

### Indexes and helper functions
Indexes discovered:
- `idx_questions_quiz_id`
- `idx_quiz_attempts_student_id`
- `idx_quiz_attempts_quiz_id`
- `idx_submissions_student_id`
- `idx_submissions_assignment_id`

Helper function:
- `public.is_admin()`
  - returns boolean
  - security definer
  - checks whether current `auth.uid()` has `role = 'admin'` in `public.profiles`
  - granted to authenticated users

### Storage buckets
The repo does not contain SQL that creates a storage bucket, but the code writes to and reads from the bucket named `assignments`:
- admin assignment upload: `supabase.storage.from("assignments").upload(...)`
- assignment download: `supabase.storage.from("assignments").download(...)`
- assignment deletion: `supabase.storage.from("assignments").remove([...])`
This means the bucket must exist in the live Supabase project before the app can fully use assignment uploads.

### RLS summary
Database-level access is enforced with policy names in `supabase/schema.sql`:
- `profiles_*`
- `quizzes_*`
- `questions_*`
- `attempts_*`
- `assignments_*`
- `submissions_*`

### Migration history
No migration directory or timestamped migration files were found. The only SQL files are:
- `supabase/schema.sql`
- `supabase/diagnostics.sql`
This project does not currently contain a migration system or versioned migration history.

### Chronological migration list
No actual timestamped migration sequence is present; only a schema file and diagnostics script exist.

| Migration file | Date/name | What it changes | Tables affected | Policies affected | Functions affected |
|---|---|---|---|---|---|
| `supabase/schema.sql` | No date; project schema definition | Creates all core tables, indexes, helper function, and RLS policies | `profiles`, `quizzes`, `questions`, `quiz_attempts`, `assignments`, `submissions` | All policies listed above | `public.is_admin()` |
| `supabase/diagnostics.sql` | No date; debugging aid | Provides read-only validation queries for profiles, policies, and RLS | All listed tables | Diagnostic-only, no schema change | none |

---

## 7) Authentication & Authorization

### Login flow
Flow:
`/login` → `supabase.auth.signInWithPassword({ email, password })` → read `auth.users` entry → query `public.profiles` by `id` → read role → redirect to `/admin` if `role === 'admin'`, otherwise `/dashboard`

Files involved:
- `app/login/page.tsx`
- `lib/supabase-browser.ts`
- `supabase/schema.sql`

### Logout flow
Flow:
`Navbar` button click → `supabase.auth.signOut()` → `router.replace('/login')`

Files involved:
- `components/Navbar.tsx`

### Session handling
This repo uses Supabase Auth from the browser via `createBrowserClient()` with the normal public anon key. There is no custom cookie wrapper or middleware file in the repo. `lib/supabase-server.ts` exists but is not used by the current app pages according to the repository search.

### Admin authentication and access checks
The app uses a profile-based role check rather than explicit admin permissions middleware.
Actual implementation pattern:
- login fetches `profiles` by the logged-in user id
- the app compares `profile.role`
- admin pages redirect non-admin users to `/dashboard`
- student pages redirect admin users to `/admin`

Examples:
- `app/admin/page.tsx` checks `if (profileData.role !== 'admin') router.replace('/dashboard')`
- `app/dashboard/page.tsx` checks `if (profileData.role === 'admin') router.replace('/admin')`
- `app/quizzes/page.tsx` checks `if (profileData.role === 'admin') router.replace('/admin')`
- `app/quiz/[id]/page.tsx` checks `if (profileData.role === 'admin') router.replace('/admin')`

### Server-side and client-side auth model
- Browser client: `lib/supabase-browser.ts`
- Server client helper: `lib/supabase-server.ts`
- DB-level auth enforcement: `public.is_admin()` + RLS policies in `supabase/schema.sql`

### Unauthorized behavior
- If `auth.getUser()` fails or there is no logged-in user: page redirects to `/login`
- If the logged-in user is admin but the student page is requested: redirect to `/admin`
- If the logged-in user is student but admin page is requested: redirect to `/dashboard`

### 401 and 403 behavior
No explicit 401/403 endpoints or status handlers exist in the repo. The app handles these conditions with client redirects, not HTTP status codes.

### Known auth limitation
This project does not include a registration flow or role-management UI. The role must already exist in `public.profiles`, and the app assumes the user exists in both Supabase Auth and the profile table.

---

## 8) Admin Panel Map

### `/admin`
File: `app/admin/page.tsx`
Current admin sections implemented:

#### Dashboard overview
Purpose: show summary cards and recent admin metrics
Sections:
- total students
- total quizzes
- published quizzes
- total attempts
Components: `StatCard`
Database: `profiles`, `quizzes`, `quiz_attempts`
Permissions: `profile.role === 'admin'`
CRUD: read-only stats
Status: Active

#### Quiz creation
Purpose: create a new quiz and optional questions
Components: `QuizForm`, `QuestionForm`
Database: `quizzes`, `questions`
Permissions: only admin via RLS and UI check
CRUD operations: insert quiz + insert questions
Status: Active

#### Quiz publish/unpublish toggle
Purpose: toggle `quizzes.published`
Database: `quizzes`
Permissions: admin-only
Toggle behavior: `togglePublish(quiz)` updates `published` boolean
Status: Active

#### Quiz delete
Purpose: delete a quiz and associated question/attempt rows due to `ON DELETE CASCADE`
Database: `quizzes`, `questions`, `quiz_attempts`
Permissions: admin-only
CRUD operations: delete
Status: Active

#### Assignment creation
Purpose: create an assignment record and upload an assignment file to storage
Components: assignment file input section in `app/admin/page.tsx`
Storage usage: Supabase Storage bucket `assignments`
Database: `assignments`
Permissions: admin-only
CRUD operations: insert assignment row + upload file
Status: Active

#### Assignment delete
Purpose: delete assignment metadata and optionally remove the uploaded file from storage
Database: `assignments`, storage bucket `assignments`
Permissions: admin-only
CRUD operations: delete
Status: Active

#### Student roster listing
Purpose: list all profiles with role `student`
Database: `profiles`
Permissions: admin-only
CRUD operations: read-only list
Status: Active

#### Excel export
Purpose: export the currently loaded students list to an `.xlsx` file
Library: `xlsx`
Database: `profiles`
Permissions: admin-only
Crud: export only
Status: Active

### Missing admin sections
The current repo does not contain any discovered modules for:
- products
- inventory
- orders
- customers
- gift lists
- homepage content management
- media library management
- settings management
- user role management UI
- file upload management beyond assignment uploads

These sections are absent from the repository and are not implemented in the current codebase.

---

## 9) Storefront Feature Map

This repository is not a storefront or commerce application. It is a learning platform. The customer-facing features are:

### Landing page
Route: `/`
Files: `app/page.tsx`
Purpose: marketing landing page for TurboX and general product positioning
Features: hero, CTA, feature pillars
Status: Active

### Login
Route: `/login`
Files: `app/login/page.tsx`
Purpose: access control for student/admin experience
Status: Active

### Student dashboard
Route: `/dashboard`
Files: `app/dashboard/page.tsx`
Purpose: overview of progress and navigation to student features
Status: Active

### Quiz listing
Route: `/quizzes`
Files: `app/quizzes/page.tsx`, `components/QuizCard.tsx`
Purpose: display published quizzes available for students
Status: Active

### Quiz experience
Route: `/quiz/[id]`
Files: `app/quiz/[id]/page.tsx`
Purpose: complete timed quiz experience with interactive answer state and result screen
Status: Active

### Assignment workspace
Route: `/assignments`
Files: `app/assignments/page.tsx`
Purpose: assignment download and file submission flow
Status: Active

### Grade history
Route: `/grades`
Files: `app/grades/page.tsx`
Purpose: display past quiz score history
Status: Active

### Admin workspace
Route: `/admin`
Files: `app/admin/page.tsx`
Purpose: operational management and course administration
Status: Active

---

## 10) Product System

### Important note
This repo is not an e-commerce or catalog system. There is no product table, product pricing, inventory table, categories, or product gallery system.

### Equivalent product-like entities
In this codebase, the nearest equivalents to “products” are:
- `quizzes`
- `assignments`

### Quiz creation workflow
Admin UI (`app/admin/page.tsx`) → `QuizForm` component → insert into `public.quizzes` → insert rows into `public.questions`

### Quiz publishing
- `quizzes.published` boolean controls visibility
- student listing uses `.eq('published', true)` in `app/quizzes/page.tsx`

### Question metadata
Each question stores:
- `question_text`
- `options` (JSONB array of 4 strings)
- `correct_answer`
- `points`

### Product/gallery-like limitations
Because the repo is not an e-commerce app, the following are not implemented:
- no product catalog
- no categories
- no inventory quantity system
- no featured products
- no product images
- no product gallery ordering
- no pricing metadata
- no cart/wishlist
- no checkout flow
- no shipping system

### Image count question
Not applicable in this codebase. The app does not implement product images or arbitrary asset galleries. Assignment files are uploaded to Supabase storage, but they are not used as a product gallery. There is no evidence of multiple image arrays, dynamic gallery ordering, or image counts beyond storage paths being per assignment/submission.

---

## 11) Media / Storage System

### Storage buckets discovered
Only one bucket is referenced by code: `assignments`

Evidence:
- `app/admin/page.tsx` uses `supabase.storage.from("assignments")`
- `app/assignments/page.tsx` uses `supabase.storage.from("assignments")`

### Bucket behavior
- Upload file for admin-created assignment docs
- Student upload their solution file to the same bucket under a path like:
  - `submissions/{user.id}/{assignment.id}/{fileName}`
- Download assignment file as a blob
- Remove file when replaced or deleted

### Public/private status
No explicit storage policy definitions are committed in this repo. The code assumes the bucket exists and is accessible to the project identity configured in Supabase. No public bucket configuration is shown here.

### File types
No explicit MIME/type validation exists in the code. The app accepts `input type="file"` without a restricted file type list. The only runtime classification is by extension in the generated file name.

### Image/video handling
No image/video pipeline is present in the repo. No media-heavy components like hero videos, intro videos, or static assets are present. There is no `public/` directory. There are no `video`, `img`, `font`, or `icon` source assets in the workspace as currently listed.

### URL generation
The app does not create public URLs for storage objects; it downloads via the Supabase JS client instead of generating a direct URL.

### Storage and DB relation
Assignment or submission file paths are stored in DB as `file_path` strings in:
- `public.assignments.file_path`
- `public.submissions.file_path`

### Files using storage
- `app/admin/page.tsx`
- `app/assignments/page.tsx`

---

## 12) Homepage System

### Homepage route
`/`
File: `app/page.tsx`

### Homepage sections discovered
- top nav with brand text and login CTA
- hero headline: “Learn. Practice. Perform.”
- supporting text
- single CTA button: “Get Started” linking to `/login`
- three feature cards summarizing the learning platform
- footer with brand and tagline

### Hardcoded vs database-controlled content
Everything on the current home page is hardcoded in `app/page.tsx`.
There is no CMS, setting table, or admin-controlled homepage content in the repo.

### No hero video / intro video / logo asset system
The app does not include any discovered hero video, intro video, image asset, or brand logo asset file in the workspace. The home page uses text only and uses CSS radial gradients instead of stored media.

### Responsive behavior
- `max-w-6xl`, `px-6`, `sm:px-10` for layout width
- `sm:grid-cols-3` for features grid on larger screens
- text size changes via `sm:text-6xl` and `sm:text-lg`
- no custom mobile-specific logic beyond standard responsive Tailwind classes

---

## 13) Settings System

No dedicated settings architecture was found in the repository.

### What is actually present
- environment settings in `.env.example`
- app metadata in `app/layout.tsx`
- CSS theme variables in `app/globals.css`
- Tailwind theme config in `tailwind.config.ts`

### Settings keys discovered
No database settings table, no settings API endpoints, and no setting keys like phone, WhatsApp, homepage content, or hero content were found.

### Evidence
- Search for setting-related names (`phone`, `whatsapp`, `hero`, `homepage`, `settings`) did not reveal a dedicated settings system in the repo
- No `settings` table exists in `supabase/schema.sql`
- No `settings` route or admin section exists

### Status
Unknown/absent: this project does not currently implement a settings layer.

---

## 14) Environment Variables

### File: `.env.example`
This is the only environment file present in the repo.

| Variable name | Type | Used by | Status |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase browser/server client creation | Present in `.env.example`; actual value is not committed |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase browser/server client creation | Present in `.env.example`; actual value is not committed |

### Additional variables discovered
None.

### Secret classification
No secret values, DB passwords, service role keys, or private tokens are present in the repo.

---

## 15) External Links & URLs

### Internal routes found
The following internal route strings are used in code:
- `/`
- `/login`
- `/dashboard`
- `/quizzes`
- `/quiz/[id]`
- `/assignments`
- `/grades`
- `/admin`

### External URLs found
None in the current source code.

### Hardcoded domains and social links
None discovered.

### Evidence from search
Searches for `https://`, `http://`, `mailto:`, `tel:`, and social links returned no meaningful external URLs in the project source.

### Status
- internal URLs: present
- external URLs: none discovered
- hardcoded API URLs: none discovered in source
- OAuth/auth URLs: none discovered

---

## 16) Navigation Map

### Landing page nav
Source: `app/page.tsx`
Label → Destination
- `Sign in` → `/login`
- `Get Started` → `/login`

### Student navigation
Source: `components/Navbar.tsx`
Role: `student`
Label → Destination
- `Dashboard` → `/dashboard`
- `Quizzes` → `/quizzes`
- `Assignments` → `/assignments`
- `Grades` → `/grades`
- `Logout` → `/login` after sign-out

### Admin navigation
Source: `components/Navbar.tsx`
Role: `admin`
Label → Destination
- `Admin` → `/admin`
- `Logout` → `/login` after sign-out

### Button navigation within pages
- `app/admin/page.tsx` : `Student View` → `/quizzes`
- `app/dashboard/page.tsx` : nav cards to `/quizzes`, `/assignments`, `/grades`
- `app/quiz/[id]/page.tsx` : buttons to `/dashboard` and `/grades`
- `app/assignments/page.tsx` : button back to `/dashboard`

### Dead links / missing routes
- No dead links found from the source code that were directly referenced by route strings, but this project is missing a general route to a user profile or settings page.
- No 404 route is implemented in the current app.

### Missing navigation items
There are no links found for:
- profile management
- notifications
- admin role management
- settings
- FAQ
- contact
- support

### Duplicated navigation
No duplicates beyond the same route being used in both desktop and mobile nav in `Navbar.tsx`.

---

## 17) Responsive Design Map

### Tailwind breakpoints
The repo uses Tailwind default breakpoints via classes such as:
- `sm:`
- `md:`
- `lg:`
- `xl:` is not used in the current repo

No custom breakpoint values are configured in `tailwind.config.ts`.

### Desktop layout
Used throughout app pages:
- `mx-auto max-w-6xl` or `max-w-7xl`
- `grid` layouts
- two-column and three-column cards depending page
- tables with horizontal overflow on small screens

### Mobile layout
Examples:
- `sm:flex-row` and `flex-col` in layout wrappers
- `sm:grid-cols-3`, `sm:grid-cols-2`, `lg:grid-cols-3` in quiz cards and dashboards
- `overflow-x-auto` on table containers
- horizontal mobile nav in `Navbar.tsx` with `overflow-x-auto`

### Product gallery/mobile behavior
No product gallery exists in the codebase. A separate gallery component is not present.

### Admin dashboard mobile behavior
Admin dashboard tables are wrapped in `overflow-x-auto` and keep horizontal scroll support.

### Quiz experience mobile behavior
Large quiz page is arranged in a stacked or responsive layout using `lg:grid-cols-[1fr_300px]`, and the question navigator side panel becomes sticky on larger screens.

### Potential issues / observed constraints
- There is no dedicated image or media asset management system.
- There are no route-level mobile-specific policies beyond responsive utility classes.
- The code does not include any custom breakpoints or complex responsive components beyond standard layout classes.

---

## 18) State Management

### State management model in this project
The repository uses React local state and Supabase as the primary data source. There is no Redux, Zustand, or centralized app store.

### State patterns discovered
- `useState` in pages and components for form fields and fetched data
- `useEffect` for data loading and auth gating
- `useCallback` for refetch logic
- `useMemo` for timer formatting in `app/quiz/[id]/page.tsx`

### Providers / contexts
No `Context.Provider`, `createContext`, or application-level state provider files were found.

### Notable stateful features
- login form state (`email`, `password`, `loading`, `error`)
- dashboard stats (`profile`, `email`, `stats`, `loading`)
- quiz-taking state (`answers`, `currentQuestion`, `timeLeft`, `result`)
- admin form state (`showForm`, `showAssignmentForm`, `assignmentTitle`, etc.)
- selected assignment file state and filesystem upload state

### Persistence method
- authentication persistence is managed by Supabase Auth and cookies
- data persistence is managed in the Supabase database and storage
- no browser local storage or custom store was found

---

## 19) Data Flow

### Authentication data flow
`LoginPage` → `supabase.auth.signInWithPassword()` → `auth.users` → `public.profiles` query by `id` → role check (`student` or `admin`) → redirect to `/dashboard` or `/admin`

### Quiz creation flow
Admin UI (`app/admin/page.tsx`) → `QuizForm` → `supabase.from('quizzes').insert(...)` → `supabase.from('questions').insert(...)` → quiz appears in `/quizzes` when published

### Quiz taking flow
Student login → `/quizzes` → choose quiz → `/quiz/[id]` loads quiz + questions → answer state tracked in React → submit triggers score computation → `quiz_attempts` row inserted → result screen shown → `/grades` shows attempt history

### Assignment flow
Admin creates assignment in `/admin` → file upload to Supabase Storage bucket `assignments` → assignment row inserted in `public.assignments` → student visits `/assignments` → file download or upload to `public.submissions` → grade/feedback stored in `submissions`

### Dashboard stats flow
Student or admin page calls Supabase queries → data transformed into summary numbers → `StatCard` components render values

---

## 20) File Dependency Map

### Student auth and dashboard dependency chain
`app/dashboard/page.tsx` → `Navbar` → `supabaseBrowser()` → `profiles` + `quiz_attempts` → `StatCard`

### Quiz list dependency chain
`app/quizzes/page.tsx` → `QuizCard` → `supabaseBrowser()` → `quizzes` + `questions` → `profiles` role check

### Quiz-taking dependency chain
`app/quiz/[id]/page.tsx` → `supabaseBrowser()` → `profiles` → `quizzes` → `questions` → `quiz_attempts` → `Navbar` + `Loading`

### Admin dashboard dependency chain
`app/admin/page.tsx` → `QuizForm` + `Navbar` + `StatCard` + `EmptyState` → `supabaseBrowser()` → `profiles` + `quizzes` + `questions` + `quiz_attempts` + `assignments` + `submissions` → `XLSX`

### Assignment dependency chain
`app/assignments/page.tsx` → `supabaseBrowser()` → `assignments` + `submissions` + Storage bucket `assignments` → `Navbar`

---

## 21) Feature Status Matrix

| Feature | Route | Main Files | API | Database | Admin | Status | Notes |
|---|---|---|---|---|---|---|---|
| Landing page | `/` | `app/page.tsx` | none | none | no | Implemented | Static marketing page |
| Login | `/login` | `app/login/page.tsx` | none | `profiles`, `auth.users` | no | Implemented | Role-based redirect after login |
| Student dashboard | `/dashboard` | `app/dashboard/page.tsx` | none | `profiles`, `quiz_attempts` | no | Implemented | Student summary view |
| Quiz listing | `/quizzes` | `app/quizzes/page.tsx`, `components/QuizCard.tsx` | none | `quizzes`, `questions` | no | Implemented | Published quizzes only |
| Quiz taking | `/quiz/[id]` | `app/quiz/[id]/page.tsx` | none | `quizzes`, `questions`, `quiz_attempts` | no | Implemented | Timer, scoring, result screen |
| Assignment workspace | `/assignments` | `app/assignments/page.tsx` | none | `assignments`, `submissions` | no | Implemented | Download/upload flow |
| Grade history | `/grades` | `app/grades/page.tsx` | none | `quiz_attempts`, `quizzes` | no | Implemented | Student attempt list |
| Admin dashboard | `/admin` | `app/admin/page.tsx` | none | `profiles`, `quizzes`, `questions`, `attempts`, `assignments`, `submissions` | yes | Implemented | Includes stats, creation, export |
| Quiz creation | `/admin` | `components/QuizForm.tsx`, `components/QuestionForm.tsx` | none | `quizzes`, `questions` | yes | Implemented | Admin-only |
| Assignment creation | `/admin` | `app/admin/page.tsx` | none | `assignments` + storage | yes | Implemented | Uploads file to `assignments` bucket |
| Storage bucket setup | N/A | `supabase/schema.sql` | none | storage bucket config missing in repo | yes | Partial | Bucket is used but not created by repo SQL |
| Settings system | N/A | none | none | none | no | Missing | No settings table or admin configuration system |
| Product catalog | N/A | none | none | none | no | Missing | Not an e-commerce app |
| API layer | N/A | none | none | none | no | Missing | No `app/api` routes found |

---

## 22) Known Issues

### 1. Environment variables are not actually present
Issue: there is no committed `.env` or `.env.local`; the app will fail at runtime without `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Evidence: `.env.example` contains blanks, and `lib/supabase-browser.ts` throws if either value is missing.
File: `lib/supabase-browser.ts`, `.env.example`
Impact: app cannot connect to Supabase until environment values are set in the live environment.
Suggested investigation: ensure real environment values are supplied in the deployment environment and local setup.

### 2. Database schema mismatch with runtime code: `duration_minutes` is used but not in schema
Issue: app code inserts and reads `duration_minutes` on `quizzes`, but `supabase/schema.sql` does not define that column.
Evidence: `components/QuizForm.tsx` inserts `duration_minutes`, and `app/quiz/[id]/page.tsx` reads `quizData.duration_minutes`; `supabase/schema.sql` defines `quizzes` without that field.
File: `components/QuizForm.tsx`, `app/quiz/[id]/page.tsx`, `supabase/schema.sql`
Impact: quiz time limits may fail or be undefined in the live database.
Suggested investigation: add the missing column to the schema and any database migrations.

### 3. `profiles.email` is not a real database column, but the UI reads it
Issue: `Profile` interface includes `email?: string | null`, but the actual table definition in `supabase/schema.sql` does not include an `email` column. UI code accesses `s.email` in `app/admin/page.tsx` and `userData.user.email` from auth context, which can show `—` for database rows.
Evidence: `lib/types.ts` includes `email?: string | null`; `supabase/schema.sql` does not include `email` in `public.profiles`.
File: `lib/types.ts`, `supabase/schema.sql`, `app/admin/page.tsx`
Impact: student email display in the admin list may be blank or undefined.
Suggested investigation: fetch email from `auth.users` or add/persist it in `profiles` deliberately.

### 4. Assignment storage bucket is referenced but not created in the repo
Issue: the code assumes a Supabase Storage bucket named `assignments` exists, but there is no SQL to create that bucket.
Evidence: `app/admin/page.tsx` and `app/assignments/page.tsx` call `supabase.storage.from('assignments')`.
File: `app/admin/page.tsx`, `app/assignments/page.tsx`
Impact: assignment upload/download will fail if the bucket does not exist in the live Supabase project.
Suggested investigation: create the bucket in Supabase settings or add provisioning SQL if supported.

### 5. No API layer or route handlers exist
Issue: all logic is direct browser Supabase access, which means the repo does not provide an API or backend service layer.
Evidence: no `app/api/**/*` or `route.ts` files were found.
File: workspace scan results
Impact: if security rules or business logic need to be centralized, the current repo has no place for it.
Suggested investigation: decide whether the project should keep direct client access or add server-side routes/actions.

### 6. There is no committed migration system
Issue: only a schema file exists; no migration history or versioned SQL is stored.
Evidence: `supabase/` contains only `schema.sql` and `diagnostics.sql`.
File: `supabase/`
Impact: change tracking and database deployment reproducibility are limited.
Suggested investigation: add formal migration management if the project grows.

### 7. `supabase-server.ts` is present but not used
Issue: there is a server helper intended for server-side usage, but no current app file imports it.
Evidence: search found no imports of `@/lib/supabase-server` in the app.
File: `lib/supabase-server.ts`
Impact: server-side patterns are not being used in the current implementation.
Suggested investigation: confirm whether server-side usage is intentionally deferred or the file is leftover code.

### 8. `lib/supbase/client.ts` is an unused duplicate helper
Issue: same logic as `lib/supabase-browser.ts` exists in a different path and is not used anywhere.
Evidence: `lib/supbase/client.ts` has no import references in the repo.
File: `lib/supbase/client.ts`
Impact: code duplication and confusion; possible maintenance risk.
Suggested investigation: remove or canonicalize this duplicate.

### 9. No explicit file-type restrictions or storage policies are committed
Issue: the repo accepts any file type for assignment upload and does not show storage policies.
Evidence: assignment file inputs have no `accept` filter, and no bucket policy definitions are in the repo.
File: `app/admin/page.tsx`, `app/assignments/page.tsx`
Impact: there is no repository-level restriction for file types or storage access policies.
Suggested investigation: add upload validation and confirm Supabase Storage policies in the live project.

---

## 23) Unused / Orphaned Code

### Verified or likely unused
1. `lib/supbase/client.ts`
- Purpose: duplicate browser client helper
- Evidence: no imports found
- Status: likely orphaned duplicate

2. `lib/supabase-server.ts`
- Purpose: server client helper
- Evidence: no imports from app code
- Status: present but not currently used in the repository

3. `public/` directory
- Purpose: expected for public static assets, fonts, icons, images, videos, and similar files
- Evidence: absent from workspace
- Status: not present; no static asset pipeline is currently used

4. No admin role management UI or settings system
- There is no discovered page or component to manage users, roles, or system settings
- Status: not implemented

### Not enough evidence to call truly orphaned
- Some type/interface names may be partly unused, but they are not obviously dead code from this repo’s size. No mass dead-code tool was run, so this section is limited to code paths with direct evidence.

---

## 24) Package / Dependency Map

### Core runtime dependencies
- `next`: framework and app runtime
- `react`: UI library
- `react-dom`: DOM rendering for React apps
- `@supabase/ssr`: SSR-safe Supabase client for Next.js auth and cookie handling
- `@supabase/supabase-js`: general Supabase client library
- `xlsx`: Excel export generation

### Styling dependencies
- `tailwindcss`: styling system
- `postcss`: compiles Tailwind pipeline
- `autoprefixer`: CSS prefixing for browser compatibility

### Development tooling
- `typescript`: type checking and transpilation
- `eslint`: linting
- `@eslint/eslintrc`: ESLint compatibility layer for the new config
- `@types/node`, `@types/react`, `@types/react-dom`: TypeScript type definitions

### Notably absent
- no `framer-motion`, `lucide-react`, `zustand`, `redux`, `clsx`, `date-fns`, `react-hook-form`, or similar libraries were found
- no animation library is in the dependency list
- no cart or storefront library was found

---

## 25) Build / Development / Deployment

### Scripts in `package.json`
- `dev`: `next dev`
- `build`: `next build`
- `start`: `next start`
- `lint`: `eslint`

### Build status
No build was run in this documentation task, since the task is documentation-only and not code modification. The project is configured as a standard Next.js app, and the script commands above are the repository’s configured build/dev path.

### Next.js config
File: `next.config.ts`
Configuration:
- `eslint.ignoreDuringBuilds = true`
No other custom config is present in the repo.

### Deployment config
No deployment configuration file such as `vercel.json`, `Dockerfile`, or platform-specific config was found in the workspace listing.

### Required environment variables
At runtime, the app requires:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

There is no actual `.env` file in the repo, so these must be supplied externally.

---

## 26) Security Map

### Authentication security
- Supabase Auth is used for user authentication.
- The app uses `signInWithPassword()` on the browser client.
- Login is implemented in the client UI, not in a server route.

### Authorization and RBAC
- The app authorizes by checking `public.profiles.role`.
- Database-level authorization is enforced by RLS in `supabase/schema.sql`.
- The helper function `public.is_admin()` checks if the current user is an admin.

### RLS evidence
`supabase/schema.sql` includes all RLS policies such as:
- `quizzes_select_published`
- `questions_select_published_or_admin`
- `attempts_select_own_or_admin`
- `assignments_select_all`
- `submissions_select_own_or_admin`

### Storage security
No storage policies are present in the repo, and the bucket is not created in SQL. The live Supabase project must have proper bucket policies configured outside the repo.

### Public/private data classification
- public-facing queries use published quizzes only
- authenticated users may access their own attempts and submissions
- admin users can read all data covered by the RLS policies

### Secret handling
- secrets are not exposed in the repo
- there is no committed secret file or real `.env` values
- service role key and database passwords are not present in the codebase.

---

## 27) Complete “Where Is Everything?” Index

- Where is login? → `app/login/page.tsx`
- Where is the landing page? → `app/page.tsx`
- Where is the admin dashboard? → `app/admin/page.tsx`
- Where is the student dashboard? → `app/dashboard/page.tsx`
- Where is the quiz list? → `app/quizzes/page.tsx`
- Where is a single quiz page? → `app/quiz/[id]/page.tsx`
- Where are assignments? → `app/assignments/page.tsx`
- Where are grades? → `app/grades/page.tsx`
- Where is the shared navbar? → `components/Navbar.tsx`
- Where is the admin quiz form? → `components/QuizForm.tsx`
- Where is the individual question editor? → `components/QuestionForm.tsx`
- Where is the loading component? → `components/Loading.tsx`
- Where is the empty state? → `components/EmptyState.tsx`
- Where is the shared type model? → `lib/types.ts`
- Where is the browser Supabase client? → `lib/supabase-browser.ts`
- Where is the server Supabase client helper? → `lib/supabase-server.ts`
- Where is the database schema? → `supabase/schema.sql`
- Where are the diagnostics queries? → `supabase/diagnostics.sql`
- Where is the role helper function defined? → `supabase/schema.sql` (`public.is_admin()`)
- Where is the storage upload logic? → `app/admin/page.tsx` and `app/assignments/page.tsx`
- Where is the global CSS theme? → `app/globals.css`
- Where is the Tailwind configuration? → `tailwind.config.ts`
- Where is the project config? → `package.json`
- Where are the environment variables documented? → `.env.example`
- Where are the build scripts? → `package.json`
- Where is the app root layout? → `app/layout.tsx`

---

## 28) Complete URL Index

| Type | URL | Source File | Purpose | Status |
|---|---|---|---|---|
| Internal route | `/` | `app/page.tsx` | Landing page | Active |
| Internal route | `/login` | `app/login/page.tsx` | Login page | Active |
| Internal route | `/dashboard` | `app/dashboard/page.tsx` | Student dashboard | Active |
| Internal route | `/quizzes` | `app/quizzes/page.tsx` | Published quiz list | Active |
| Internal route | `/quiz/[id]` | `app/quiz/[id]/page.tsx` | Quiz taking | Active |
| Internal route | `/assignments` | `app/assignments/page.tsx` | Assignment workspace | Active |
| Internal route | `/grades` | `app/grades/page.tsx` | Student grades | Active |
| Internal route | `/admin` | `app/admin/page.tsx` | Admin dashboard | Active |
| External URL | none discovered | search | no external links present in repo | none |
| API URL | none discovered | search | no API routes in repo | none |
| Supabase URL | none present in repo | `.env.example` only | connection target placeholder | unknown |

---

## 29) Important File Index

| File | Purpose | Used By | Importance |
|---|---|---|---|
| `package.json` | project scripts and deps | local build/dev | High |
| `next.config.ts` | Next.js config | build system | Medium |
| `app/layout.tsx` | app metadata and root shell | all pages | High |
| `app/page.tsx` | landing page | `/` | High |
| `app/login/page.tsx` | authentication | `/login` | High |
| `app/dashboard/page.tsx` | student overview | `/dashboard` | High |
| `app/quizzes/page.tsx` | published quiz list | `/quizzes` | High |
| `app/quiz/[id]/page.tsx` | quiz engine | `/quiz/[id]` | High |
| `app/assignments/page.tsx` | assignment workflow | `/assignments` | High |
| `app/grades/page.tsx` | grade history | `/grades` | High |
| `app/admin/page.tsx` | admin operations | `/admin` | High |
| `components/Navbar.tsx` | navigation + logout | many pages | High |
| `components/QuizForm.tsx` | quiz creation form | admin page | High |
| `components/QuestionForm.tsx` | question editor | quiz form | Medium |
| `lib/types.ts` | shared model definitions | pages and components | High |
| `lib/supabase-browser.ts` | browser Supabase client | many pages | High |
| `lib/supabase-server.ts` | server client helper | not used in current repo | Medium |
| `supabase/schema.sql` | DB schema + RLS | live Supabase project | Critical |
| `supabase/diagnostics.sql` | debugging SQL | manual verification | Medium |
| `.env.example` | env var names | live env setup | High |

---

## 30) Final Project Summary

### A. What is fully implemented
- Landing page marketing page
- Login flow using Supabase Auth
- Role-based redirect for `student` and `admin`
- Student dashboard overview
- Published quiz list and dynamic quiz-taking flow
- Quiz scoring and storage to `quiz_attempts`
- Assignment list and student submission upload flow
- File download capability for assignments
- Admin dashboard with stats and basic CRUD for quizzes and assignments
- Student roster listing and Excel export
- Database schema + RLS definitions for the current app domain

### B. What is partially implemented
- Storage bucket usage is partially implemented in code but the bucket creation is not included in repo SQL
- `duration_minutes` is used in app code, but the schema file does not define it
- server-side auth helper exists but is not used by the current application pages

### C. What is placeholder
- The admin and user management features are minimal and only use profile roles from the existing DB; no dedicated role management UI or onboarding flow exists
- The landing page is static and not user-editable from an admin CMS
- There are no settings or homepage CMS features

### D. What is missing
- Actual environment values in a real `.env` file
- API routes and a backend service layer
- Migration history or timestamped DB migration files
- Product catalog, cart, checkout, wishlist, and storefront features
- Any external URLs, social links, contact pages, or media assets
- Settings system, profile page, notifications, or invoice/order module

### E. What appears broken
- The app depends on `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` existing in the runtime environment; without them, it throws errors
- Database schema mismatch: `quizzes.duration_minutes` is used in code but not created in the SQL file
- `profiles.email` is not a schema field even though the UI expects it
- Assignment upload/download depend on a bucket that is not provisioned through repo code
- There is no API layer or backend enforcement beyond database-level RLS rules

### F. Important technical dependencies
- Next.js 15 App Router
- React 19
- Supabase SSR and Supabase JS
- Tailwind CSS
- TypeScript
- `xlsx` for export

### G. Important risks
- runtime failure without valid env vars
- database drift between app code and schema
- no migration system for reproducibility
- no storage provisioning in repo
- no no-code central server-side authorization layer beyond client redirects and RLS

### H. Recommended areas for future investigation
- ensure the Supabase project and storage bucket are created correctly
- align schema with runtime app code, especially `quizzes.duration_minutes`
- decide whether browser-only DB access is acceptable or if server-side routes/actions are needed
- add formal migrations and environment deployment procedures
- add missing settings, role-management, and user lifecycle features if the project is meant to expand beyond the current learning-platform scope

---

## Final verification notes

This documentation was assembled directly from the current repository contents:
- `package.json`
- `next.config.ts`
- `.env.example`
- `app/**`
- `components/**`
- `lib/**`
- `supabase/**`
- workspace search for API routes, env files, links, and settings-related code

Limitations and uncertainty:
- No actual `.env` file was found in the project workspace, so the live project secret values and deployment settings cannot be verified from this repo
- No API routes or public assets directory were present in the repo at the time of inspection
- No migration folder or versioned migration history was present
- No external URLs or social/media assets were present in the codebase
- The project is a learning platform, not a storefront or commerce system, so product-system sections in the required template are documented as “not implemented” rather than assumed
