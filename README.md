# SEMTRACK — My Semester Dashboard

A personal, responsive semester-preparation dashboard built with React, TypeScript, Vite, Tailwind CSS, Supabase Auth/PostgreSQL, and Vercel.

## What it includes

- Email/password sign-up and sign-in with a persistent Supabase Auth session.
- Per-account provisioning of Theory of Computation (5 units), Artificial Intelligence (5), Computer Networks (5), Cloud Computing (5), and IPR and Cyber Laws (4).
- Unit completion saved to PostgreSQL, including completion timestamps, with progress and analytics derived from saved records.
- Editable exam dates and times, saved to PostgreSQL and counted down using `Asia/Kolkata`. Dates begin unset.
- Responsive dashboard, subject checklist, timetable, analytics, dark mode, and progress reset controls.
- Row Level Security policies and a signup trigger that seeds a user's initial study data.

## Requirements

- Node.js 20.19+ or 22.12+ (Vite 6 requirement) and npm.
- A Supabase project.
- A Vercel account for deployment.

## Run locally

1. Install dependencies:

   ```sh
   npm install
   ```

2. In the Supabase dashboard, open **SQL Editor**, paste and run the complete repair migration at [`supabase/migrations/20261113124500_repair_missing_semtrack_schema.sql`](./supabase/migrations/20261113124500_repair_missing_semtrack_schema.sql). If the schema is already installed, also run [`supabase/migrations/20261113132200_allow_user_exam_upserts.sql`](./supabase/migrations/20261113132200_allow_user_exam_upserts.sql) to allow users to insert a missing exam row for their own subject. Both migrations preserve Row Level Security and refresh the PostgREST schema cache as needed.

   The migration creates the schema, RLS policies, indexes, exam timestamp trigger, and an `auth.users` trigger that provisions the five subjects, all 24 units, and five exams with no preset date. Provisioning is idempotent, so existing exam dates and unit completion are preserved when the setup script is rerun.

3. In Supabase **Project Settings → API** (or **Data API**), copy the project URL and the **publishable** key (or legacy `anon` key). Create a `.env` file in the project root:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
   ```

   The anon/publishable key is intended for browser use and is restricted by RLS. **Never use or expose the Supabase service-role/secret key in this frontend.**

4. Configure Supabase **Authentication → URL Configuration**:
   - Set **Site URL** to your local URL while developing (`http://localhost:5173`); replace it with your Vercel domain after deployment.
   - Add both `http://localhost:5173/**` and your eventual Vercel URL (for example `https://your-app.vercel.app/**`) to **Redirect URLs**.
   - Email confirmation can remain enabled. New accounts must confirm their email before signing in if that setting is enabled.

5. Start the development server:

   ```sh
   npm run dev
   ```

6. Make a new account. The signup trigger creates that account's initial subjects and units. Sign in, check a unit, set a timetable date, and refresh to verify the database-backed state.

## Deploy to Vercel

1. Push this project to a GitHub repository.
2. In Vercel, select **Add New → Project**, import the repository, and keep the detected Vite settings:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Vercel project environment variables for **Production**, **Preview**, and **Development** as appropriate. Use the same project URL and publishable/anon key as above.
4. Deploy. Set the Supabase Auth **Site URL** to the deployed HTTPS Vercel URL and add the Vercel URL (and any preview-domain patterns you use) to the Supabase **Redirect URLs** allow list.
5. Redeploy after changing Vercel environment variables. Test sign-up/sign-in and confirm that unit and timetable updates remain after refresh and a second-device sign-in.

`vercel.json` sends application routes to the Vite SPA entry point. The app is **not hosted** until you complete the deployment steps above.

## Database and security

- `profiles`, `subjects`, `units`, and `exams` are PostgreSQL tables created by the migration.
- The signup trigger inserts a profile and seeds only the newly registered user's records.
- RLS is enabled on all four tables. Authenticated users can read their own data and update their own profile, subjects, units, and exam rows. Unit access is scoped through the owning subject; exam rows have a composite foreign key tying their owner to that subject.
- This frontend does not use a server-side service-role key. Every database read and write uses the signed-in user's Supabase session and is subject to RLS.
- The theme preference is stored in this browser only. Study progress, profile, and examination dates are stored in Supabase PostgreSQL.

## Production checks

```sh
npm run build
```

Database persistence and authentication require a configured Supabase project; no Supabase credentials are bundled in the repository. Do not describe the application as deployed until Vercel reports a successful deployment.
