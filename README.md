# DecideWise — shared AI decision-making

A deployable Next.js app where a creator creates a topic and shares one link. Participants submit their own responses; a server-side OpenAI call semantically compares responses and updates a shared report with similarities, differences, unique perspectives, and follow-up questions.

## Features in this scaffold

- Shareable topic URLs (`/?topic=<random-slug>`)
- Persistent topic and response storage in Supabase Postgres
- Creator chooses anonymous or named responses per topic
- Anyone with the topic link can submit responses and view results
- AI report refreshes after every submission; manual refresh is also available
- AI output is structured JSON and asks the model to distinguish agreement, disagreement, complementary views, and unique contributions
- Responsive interface

## Deploy (about 15–25 minutes)

### 1. Create the database

1. Create a project at https://supabase.com.
2. Open **SQL Editor** in the Supabase dashboard.
3. Run the entire `supabase/schema.sql` file.
4. In Project Settings → API, copy the Project URL and `service_role` key. Treat the service-role key like a password.

### 2. Configure OpenAI

1. Create an API key at https://platform.openai.com/api-keys and make sure billing/usage is configured.
2. The app uses `gpt-4o-mini` by default. Change `OPENAI_MODEL` if needed.

### 3. Run locally

Install Node.js 20 or newer, then:

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local` with the Supabase URL, Supabase service-role key, OpenAI API key, and app URL. Then:

```bash
npm run dev
```

Visit http://localhost:3000.

### 4. Deploy to Vercel

1. Upload this project to a private GitHub repository.
2. Import the repository at https://vercel.com.
3. Add all `.env.example` variables in Vercel → Project Settings → Environment Variables. Set `NEXT_PUBLIC_APP_URL` to your deployed Vercel URL.
4. Deploy. Test by creating a topic in one browser and submitting through the share link in another browser or incognito window.

## Important production hardening before inviting the public

This is a functional MVP scaffold, not a security-audited public service.

- **Authentication / ownership:** topic creation is currently open; anyone can create a topic. Add creator authentication and ownership controls if you need private creator controls.
- **Abuse prevention:** add rate limiting, bot protection, quotas, request-size limits, and moderation. Public creation and analysis endpoints can otherwise be abused to generate database/API costs.
- **Analysis costs:** this MVP re-runs analysis over up to 150 responses after every submission. For a large group, use a debounce/queue/background worker and incremental or batched analysis.
- **Concurrency:** simultaneous submissions can race to update the analysis. Use a queue or a database-backed job lock for robust high-volume usage.
- **Data retention & consent:** link holders can view all submitted responses. Tell participants how their responses will be used; avoid sensitive information and add delete/export controls and a retention policy.
- **Identity:** “named” mode asks the participant to type a name; it does not verify identity. “Anonymous” mode hides names in the UI but responses may still be identifiable from their text.
- **Analysis refresh:** server-side OpenAI errors are reported; a failed analysis does not delete the saved response. Check Vercel function logs and OpenAI usage if the report fails to update.
- **Long groups:** UI fetch is capped at 500 responses; analysis uses the first 150 responses in chronological order. Add pagination and a sampling/summary strategy before using at scale.
- **Privacy:** the app uses a random, unguessable topic slug as a bearer link. Anyone with the link can access the topic and responses. Do not treat the URL as authentication.

## Architecture

- Next.js App Router UI
- API routes for topics, submissions, and analysis
- Supabase Postgres for persistent storage
- OpenAI Chat Completions JSON output for semantic synthesis

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: server-only Supabase service-role key
- `OPENAI_API_KEY`: server-only OpenAI API key
- `OPENAI_MODEL`: optional model name; defaults to `gpt-4o-mini`
- `NEXT_PUBLIC_APP_URL`: deployed origin, used by automatic analysis after submissions

`INTERNAL_ANALYSIS_SECRET` is optional in this starter and is not required. Configure it and restrict the analysis endpoint before a production public launch.
